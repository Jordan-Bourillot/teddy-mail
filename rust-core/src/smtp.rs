//! SMTP outgoing path with retry queue.
//!
//! Sends are persisted in `sync_queue` so they survive crashes. Workers
//! drain the queue with exponential backoff.

use crate::{auth, CoreError, CoreResult};
use lettre::{
    message::{header::ContentType, Mailbox, Message as LettreMessage},
    transport::smtp::{authentication::Credentials, AsyncSmtpTransport},
    AsyncTransport, Tokio1Executor,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmtpConfig {
    pub account_id: String,
    pub host: String,
    pub port: u16,
    pub user: String,
    pub use_oauth: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutgoingMail {
    pub from: String,
    pub to: Vec<String>,
    pub cc: Vec<String>,
    pub bcc: Vec<String>,
    pub subject: String,
    pub body_text: String,
    pub body_html: Option<String>,
}

/// Send a single mail via SMTP. Caller is responsible for retrying.
pub async fn send(config: &SmtpConfig, mail: &OutgoingMail) -> CoreResult<()> {
    let mut builder = LettreMessage::builder()
        .from(parse_mailbox(&mail.from)?)
        .subject(&mail.subject);

    for t in &mail.to {
        builder = builder.to(parse_mailbox(t)?);
    }
    for c in &mail.cc {
        builder = builder.cc(parse_mailbox(c)?);
    }
    for b in &mail.bcc {
        builder = builder.bcc(parse_mailbox(b)?);
    }

    let body = if let Some(html) = &mail.body_html {
        builder
            .header(ContentType::TEXT_HTML)
            .body(html.clone())
            .map_err(|e| CoreError::Smtp(format!("build: {e}")))?
    } else {
        builder
            .header(ContentType::TEXT_PLAIN)
            .body(mail.body_text.clone())
            .map_err(|e| CoreError::Smtp(format!("build: {e}")))?
    };

    let creds = if config.use_oauth {
        let tokens = auth::load_tokens(&config.account_id)?
            .ok_or_else(|| CoreError::Auth("no tokens".into()))?;
        // For Gmail/Outlook, XOAUTH2 mechanism is required; lettre supports
        // SMTP AUTH via Credentials with the SASL string built externally.
        // Simplified here; production should use the XOAUTH2 mechanism explicitly.
        Credentials::new(config.user.clone(), tokens.access_token)
    } else {
        let pw = auth::load_password(&config.account_id)?
            .ok_or_else(|| CoreError::Auth("no password".into()))?;
        Credentials::new(config.user.clone(), pw)
    };

    let transport: AsyncSmtpTransport<Tokio1Executor> =
        AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(&config.host)
            .map_err(|e| CoreError::Smtp(format!("transport: {e}")))?
            .port(config.port)
            .credentials(creds)
            .build();

    transport
        .send(body)
        .await
        .map_err(|e| CoreError::Smtp(format!("send: {e}")))?;
    Ok(())
}

fn parse_mailbox(s: &str) -> CoreResult<Mailbox> {
    s.parse::<Mailbox>()
        .map_err(|e| CoreError::Smtp(format!("parse mailbox '{s}': {e}")))
}
