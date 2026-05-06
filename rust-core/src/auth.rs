//! OAuth2 (PKCE) and credential storage in OS keyring.
//!
//! Each account has a stable id (`acc_<uuid>`). Tokens live in the OS keyring
//! under `pite-lafe-mail:<account_id>:access` and `:refresh`.

use crate::{CoreError, CoreResult};
use keyring::Entry;
use serde::{Deserialize, Serialize};

const SERVICE: &str = "pite-lafe-mail";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OAuthTokens {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_at_unix: i64,
}

pub fn save_tokens(account_id: &str, tokens: &OAuthTokens) -> CoreResult<()> {
    let payload = serde_json::to_string(tokens)
        .map_err(|e| CoreError::Auth(format!("serialize tokens: {e}")))?;
    Entry::new(SERVICE, &format!("{account_id}:tokens"))?.set_password(&payload)?;
    Ok(())
}

pub fn load_tokens(account_id: &str) -> CoreResult<Option<OAuthTokens>> {
    let entry = Entry::new(SERVICE, &format!("{account_id}:tokens"))?;
    match entry.get_password() {
        Ok(s) => {
            let t: OAuthTokens = serde_json::from_str(&s)
                .map_err(|e| CoreError::Auth(format!("parse tokens: {e}")))?;
            Ok(Some(t))
        }
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

pub fn delete_tokens(account_id: &str) -> CoreResult<()> {
    let entry = Entry::new(SERVICE, &format!("{account_id}:tokens"))?;
    match entry.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.into()),
    }
}

/// Save a plain IMAP/SMTP password for accounts that don't speak OAuth.
/// We keep this on a separate keyring slot so it can be wiped independently.
pub fn save_password(account_id: &str, password: &str) -> CoreResult<()> {
    Entry::new(SERVICE, &format!("{account_id}:password"))?.set_password(password)?;
    Ok(())
}

pub fn load_password(account_id: &str) -> CoreResult<Option<String>> {
    let entry = Entry::new(SERVICE, &format!("{account_id}:password"))?;
    match entry.get_password() {
        Ok(s) => Ok(Some(s)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

/// Check whether the access token has expired (with 30s safety margin).
pub fn token_expired(tokens: &OAuthTokens) -> bool {
    let now = chrono::Utc::now().timestamp();
    tokens.expires_at_unix <= now + 30
}
