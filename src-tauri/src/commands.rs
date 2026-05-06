//! Tauri command handlers.
//!
//! Thin wrappers around `pite_lafe_core` that map errors to strings (Tauri
//! requires `Serialize` errors).

use crate::AppState;
use pite_lafe_core::{auth, parser::ParsedMail, smtp};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

fn map_err<E: std::fmt::Display>(e: E) -> String {
    e.to_string()
}

#[tauri::command]
pub fn greet() -> String {
    format!("Pite Lafe Mail v{}", env!("CARGO_PKG_VERSION"))
}

#[tauri::command]
pub async fn open_store(
    state: State<'_, AppState>,
    path: String,
    passphrase: String,
) -> Result<(), String> {
    let store =
        pite_lafe_core::store::Store::open(&PathBuf::from(path), &passphrase).map_err(map_err)?;
    let mut guard = state.store.lock().await;
    *guard = Some(Arc::new(Mutex::new(store)));
    Ok(())
}

#[tauri::command]
pub async fn is_store_open(state: State<'_, AppState>) -> Result<bool, String> {
    let guard = state.store.lock().await;
    Ok(guard.is_some())
}

#[tauri::command]
pub async fn search(
    state: State<'_, AppState>,
    query: String,
    limit: usize,
) -> Result<Vec<String>, String> {
    let guard = state.store.lock().await;
    let store = guard.as_ref().ok_or_else(|| "store not open".to_string())?;
    let s = store.lock().await;
    s.search(&query, limit).map_err(map_err)
}

#[tauri::command]
pub async fn mark_read(
    state: State<'_, AppState>,
    mail_id: String,
    read: bool,
) -> Result<(), String> {
    let guard = state.store.lock().await;
    let store = guard.as_ref().ok_or_else(|| "store not open".to_string())?;
    let s = store.lock().await;
    s.mark_read(&mail_id, read).map_err(map_err)
}

#[tauri::command]
pub async fn snooze(
    state: State<'_, AppState>,
    mail_id: String,
    until_unix: i64,
) -> Result<(), String> {
    let guard = state.store.lock().await;
    let store = guard.as_ref().ok_or_else(|| "store not open".to_string())?;
    let s = store.lock().await;
    s.snooze(&mail_id, until_unix).map_err(map_err)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SendArgs {
    pub config: smtp::SmtpConfig,
    pub mail: smtp::OutgoingMail,
}

#[tauri::command]
pub async fn send_mail(args: SendArgs) -> Result<(), String> {
    smtp::send(&args.config, &args.mail).await.map_err(map_err)
}

// ---------------- OAuth ----------------

#[derive(Debug, Serialize, Deserialize)]
pub struct OAuthStartArgs {
    pub provider: String, // "gmail" | "outlook" | "icloud"
    pub client_id: String,
    pub redirect_uri: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OAuthStartResult {
    pub auth_url: String,
    pub state_token: String,
    pub code_verifier: String,
}

/// Build a PKCE auth URL. The UI opens it in the system browser via the
/// `tauri-plugin-shell` plugin and waits for the redirect.
#[tauri::command]
pub fn start_oauth(args: OAuthStartArgs) -> Result<OAuthStartResult, String> {
    use sha2::{Digest, Sha256};

    let (auth_endpoint, scope) = match args.provider.as_str() {
        "gmail" => (
            "https://accounts.google.com/o/oauth2/v2/auth",
            "https://mail.google.com/ openid email profile",
        ),
        "outlook" => (
            "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
            "offline_access https://outlook.office.com/IMAP.AccessAsUser.All https://outlook.office.com/SMTP.Send",
        ),
        other => return Err(format!("unsupported provider: {other}")),
    };

    let state_token = random_b64url(32);
    let code_verifier = random_b64url(64);
    let mut hasher = Sha256::new();
    hasher.update(code_verifier.as_bytes());
    let code_challenge = b64url_encode(&hasher.finalize());

    let mut url = url::Url::parse(auth_endpoint).map_err(map_err)?;
    {
        let mut qs = url.query_pairs_mut();
        qs.append_pair("client_id", &args.client_id);
        qs.append_pair("redirect_uri", &args.redirect_uri);
        qs.append_pair("response_type", "code");
        qs.append_pair("scope", scope);
        qs.append_pair("state", &state_token);
        qs.append_pair("code_challenge", &code_challenge);
        qs.append_pair("code_challenge_method", "S256");
        qs.append_pair("access_type", "offline");
        qs.append_pair("prompt", "consent");
    }

    Ok(OAuthStartResult {
        auth_url: url.to_string(),
        state_token,
        code_verifier,
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OAuthCompleteArgs {
    pub provider: String,
    pub client_id: String,
    pub redirect_uri: String,
    pub code: String,
    pub code_verifier: String,
    pub account_id: String,
}

#[tauri::command]
pub async fn complete_oauth(args: OAuthCompleteArgs) -> Result<(), String> {
    let token_endpoint = match args.provider.as_str() {
        "gmail" => "https://oauth2.googleapis.com/token",
        "outlook" => "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        other => return Err(format!("unsupported provider: {other}")),
    };

    let client = reqwest::Client::new();
    let resp = client
        .post(token_endpoint)
        .form(&[
            ("client_id", args.client_id.as_str()),
            ("redirect_uri", args.redirect_uri.as_str()),
            ("code", args.code.as_str()),
            ("code_verifier", args.code_verifier.as_str()),
            ("grant_type", "authorization_code"),
        ])
        .send()
        .await
        .map_err(map_err)?;

    let json: serde_json::Value = resp.json().await.map_err(map_err)?;
    let access = json
        .get("access_token")
        .and_then(|v| v.as_str())
        .ok_or_else(|| format!("token response missing access_token: {json}"))?
        .to_string();
    let refresh = json
        .get("refresh_token")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    let expires_in = json.get("expires_in").and_then(|v| v.as_i64()).unwrap_or(3600);

    let tokens = auth::OAuthTokens {
        access_token: access,
        refresh_token: refresh,
        expires_at_unix: chrono::Utc::now().timestamp() + expires_in,
    };
    auth::save_tokens(&args.account_id, &tokens).map_err(map_err)?;
    Ok(())
}

#[derive(Debug, Serialize)]
pub struct AccountSummary {
    pub id: String,
    pub email: String,
    pub provider: String,
}

#[tauri::command]
pub fn list_accounts() -> Vec<AccountSummary> {
    // V1: stored in keyring/config; for now return empty so the UI knows
    // there are no real accounts yet and falls back to mock data.
    Vec::new()
}

#[tauri::command]
pub async fn parse_raw(raw: Vec<u8>) -> Result<ParsedMail, String> {
    pite_lafe_core::parser::parse(&raw).map_err(map_err)
}

// ---------------- helpers ----------------

fn random_b64url(bytes: usize) -> String {
    use rand::RngCore;
    let mut buf = vec![0u8; bytes];
    rand::thread_rng().fill_bytes(&mut buf);
    b64url_encode(&buf)
}

fn b64url_encode(input: &[u8]) -> String {
    use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
    URL_SAFE_NO_PAD.encode(input)
}

// Bring in deps used in this file
use sha2 as _;
use rand as _;
use base64 as _;
use reqwest as _;
use chrono as _;
