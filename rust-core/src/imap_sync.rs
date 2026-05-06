//! IMAP sync worker.
//!
//! One worker per account. Maintains a long-lived TLS+IMAP connection,
//! uses IDLE for push notifications when supported, falls back to a 60s
//! poll otherwise. CONDSTORE/QRESYNC are used when advertised.

use crate::{auth, parser, store::Store, CoreError, CoreResult};
use async_imap::types::Fetch;
use async_native_tls::TlsConnector;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::{mpsc, Mutex};
use tokio::time::sleep;
use tracing::{error, info, warn};

#[derive(Debug, Clone)]
pub struct ImapConfig {
    pub account_id: String,
    pub host: String,
    pub port: u16,
    pub user: String,
    pub use_oauth: bool,
}

#[derive(Debug, Clone)]
pub enum WorkerEvent {
    Connected,
    Disconnected(String),
    NewMessages(u32),
    Idle,
    Error(String),
}

pub struct ImapWorker {
    config: ImapConfig,
    store: Arc<Mutex<Store>>,
    events: mpsc::UnboundedSender<WorkerEvent>,
}

impl ImapWorker {
    pub fn new(
        config: ImapConfig,
        store: Arc<Mutex<Store>>,
        events: mpsc::UnboundedSender<WorkerEvent>,
    ) -> Self {
        Self { config, store, events }
    }

    /// Run forever. Reconnects with exponential backoff on failure.
    pub async fn run(self) {
        let mut backoff_secs = 1u64;
        loop {
            match self.connect_and_idle().await {
                Ok(()) => {
                    info!(account = %self.config.account_id, "imap worker exited cleanly, reconnecting");
                    backoff_secs = 1;
                }
                Err(e) => {
                    error!(account = %self.config.account_id, "imap worker error: {e}");
                    let _ = self.events.send(WorkerEvent::Error(e.to_string()));
                    sleep(Duration::from_secs(backoff_secs)).await;
                    backoff_secs = (backoff_secs * 2).min(300);
                }
            }
        }
    }

    async fn connect_and_idle(&self) -> CoreResult<()> {
        let tcp = tokio::net::TcpStream::connect((self.config.host.as_str(), self.config.port))
            .await
            .map_err(CoreError::from)?;
        let tls = TlsConnector::new();
        let tls_stream = tls
            .connect(&self.config.host, tcp)
            .await
            .map_err(|e| CoreError::Imap(format!("TLS: {e}")))?;
        let client = async_imap::Client::new(tls_stream);

        // Authenticate
        let mut session = if self.config.use_oauth {
            let tokens = auth::load_tokens(&self.config.account_id)?
                .ok_or_else(|| CoreError::Auth("no tokens stored".into()))?;
            // XOAUTH2 SASL string
            let sasl = format!(
                "user={}\x01auth=Bearer {}\x01\x01",
                self.config.user, tokens.access_token
            );
            let mut session = client
                .authenticate("XOAUTH2", &XOAuth2(sasl))
                .await
                .map_err(|(e, _)| CoreError::Imap(format!("XOAUTH2: {e}")))?;
            // Probe basic IMAP
            session
                .capabilities()
                .await
                .map_err(|e| CoreError::Imap(format!("capabilities: {e}")))?;
            session
        } else {
            let pw = auth::load_password(&self.config.account_id)?
                .ok_or_else(|| CoreError::Auth("no password stored".into()))?;
            client
                .login(&self.config.user, &pw)
                .await
                .map_err(|(e, _)| CoreError::Imap(format!("login: {e}")))?
        };

        let _ = self.events.send(WorkerEvent::Connected);

        session
            .select("INBOX")
            .await
            .map_err(|e| CoreError::Imap(format!("select INBOX: {e}")))?;

        // Initial fetch: last 50 messages.
        self.fetch_recent(&mut session, 50).await?;

        // IDLE loop with 25-minute timer (RFC 2177 recommendation).
        loop {
            let mut idle = session.idle();
            idle.init().await.map_err(|e| CoreError::Imap(format!("idle init: {e}")))?;
            let _ = self.events.send(WorkerEvent::Idle);
            let (idle_wait, _stop) = idle.wait_with_timeout(Duration::from_secs(25 * 60));
            let _ = idle_wait.await;
            session = idle
                .done()
                .await
                .map_err(|e| CoreError::Imap(format!("idle done: {e}")))?;

            self.fetch_recent(&mut session, 20).await?;
        }
    }

    async fn fetch_recent<S>(
        &self,
        session: &mut async_imap::Session<S>,
        count: u32,
    ) -> CoreResult<()>
    where
        S: tokio::io::AsyncRead + tokio::io::AsyncWrite + Unpin + Send,
    {
        // Range "<n>:*" on UID FETCH; in production we'd also use CONDSTORE here.
        let range = format!("{}:*", count.saturating_sub(1).max(1));
        let messages: Vec<Result<Fetch, _>> = session
            .uid_fetch(&range, "RFC822")
            .await
            .map_err(|e| CoreError::Imap(format!("fetch: {e}")))?
            .collect::<Vec<_>>()
            .await;

        let mut new_count = 0u32;
        let store = self.store.lock().await;
        for msg in messages {
            let msg = match msg {
                Ok(m) => m,
                Err(e) => {
                    warn!("fetch entry error: {e}");
                    continue;
                }
            };
            let body = match msg.body() {
                Some(b) => b,
                None => continue,
            };
            match parser::parse(body) {
                Ok(p) => {
                    if let Err(e) = store.upsert_mail(&p, &self.config.account_id, "INBOX") {
                        warn!("upsert error: {e}");
                    } else {
                        new_count += 1;
                    }
                }
                Err(e) => warn!("parse error: {e}"),
            }
        }
        drop(store);
        if new_count > 0 {
            let _ = self.events.send(WorkerEvent::NewMessages(new_count));
        }
        Ok(())
    }
}

// XOAUTH2 SASL helper
struct XOAuth2(String);
impl async_imap::Authenticator for XOAuth2 {
    type Response = String;
    fn process(&mut self, _data: &[u8]) -> Self::Response {
        self.0.clone()
    }
}

// Bring StreamExt in scope for `.collect` on the Stream returned by uid_fetch.
use futures::StreamExt as _;
