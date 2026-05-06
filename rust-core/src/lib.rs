//! Pite Lafe Mail core library.
//!
//! Public surface that the Tauri shell calls into. Everything async, every
//! fallible operation returns a typed `CoreError`.
//!
//! Architecture:
//!   - `auth`     OAuth2 + keyring storage
//!   - `parser`   MIME parsing, charset normalization, tracker detection
//!   - `store`    encrypted SQLite store, FTS5 index, migrations
//!   - `imap_sync` IMAP IDLE worker per account
//!   - `smtp`     outgoing mail with retry queue
//!   - `commands` exposed entry points for Tauri IPC

pub mod auth;
pub mod commands;
pub mod imap_sync;
pub mod parser;
pub mod smtp;
pub mod store;

use thiserror::Error;

#[derive(Debug, Error)]
pub enum CoreError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("SQLite error: {0}")]
    Sqlite(#[from] rusqlite::Error),
    #[error("IMAP error: {0}")]
    Imap(String),
    #[error("SMTP error: {0}")]
    Smtp(String),
    #[error("Auth error: {0}")]
    Auth(String),
    #[error("Parser error: {0}")]
    Parser(String),
    #[error("Keyring error: {0}")]
    Keyring(#[from] keyring::Error),
    #[error("Config error: {0}")]
    Config(String),
    #[error("Other: {0}")]
    Other(#[from] anyhow::Error),
}

pub type CoreResult<T> = Result<T, CoreError>;

/// Initialize logging once at process start. Idempotent.
pub fn init_logging() {
    use std::sync::Once;
    static ONCE: Once = Once::new();
    ONCE.call_once(|| {
        let _ = tracing_subscriber::fmt()
            .with_env_filter(
                tracing_subscriber::EnvFilter::try_from_default_env()
                    .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
            )
            .try_init();
    });
}
