//! Tauri command surface.
//!
//! Each function maps 1:1 to an `invoke()` call from the React UI. The Tauri
//! shell registers these via `tauri::generate_handler!`.

use crate::{
    auth,
    parser::ParsedMail,
    smtp::{self, OutgoingMail, SmtpConfig},
    store::Store,
    CoreResult,
};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;

pub type SharedStore = Arc<Mutex<Store>>;

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenStoreArgs {
    pub path: String,
    pub passphrase: String,
}

pub async fn open_store(args: OpenStoreArgs) -> CoreResult<SharedStore> {
    let path = PathBuf::from(args.path);
    let store = Store::open(&path, &args.passphrase)?;
    Ok(Arc::new(Mutex::new(store)))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchArgs {
    pub query: String,
    pub limit: usize,
}

pub async fn search(store: SharedStore, args: SearchArgs) -> CoreResult<Vec<String>> {
    let s = store.lock().await;
    s.search(&args.query, args.limit)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MarkReadArgs {
    pub mail_id: String,
    pub read: bool,
}

pub async fn mark_read(store: SharedStore, args: MarkReadArgs) -> CoreResult<()> {
    let s = store.lock().await;
    s.mark_read(&args.mail_id, args.read)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SnoozeArgs {
    pub mail_id: String,
    pub until_unix: i64,
}

pub async fn snooze(store: SharedStore, args: SnoozeArgs) -> CoreResult<()> {
    let s = store.lock().await;
    s.snooze(&args.mail_id, args.until_unix)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SendArgs {
    pub config: SmtpConfig,
    pub mail: OutgoingMail,
}

pub async fn send_mail(args: SendArgs) -> CoreResult<()> {
    smtp::send(&args.config, &args.mail).await
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StoreTokensArgs {
    pub account_id: String,
    pub tokens: auth::OAuthTokens,
}

pub async fn store_tokens(args: StoreTokensArgs) -> CoreResult<()> {
    auth::save_tokens(&args.account_id, &args.tokens)
}

pub async fn parse_raw(raw: Vec<u8>) -> CoreResult<ParsedMail> {
    crate::parser::parse(&raw)
}
