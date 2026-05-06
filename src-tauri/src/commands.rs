//! Tauri command handlers (V0.1.0 — UI-only build).
//!
//! These commands answer the IPC calls the React UI makes. In V0.1.0 the
//! mail backend isn't connected, so commands either return safe defaults (no
//! accounts, store closed) or run the OAuth URL builder, which is pure logic
//! that doesn't need rust-core.

use serde::{Deserialize, Serialize};

#[tauri::command]
pub fn greet() -> String {
    format!("Teddy Mail v{}", env!("CARGO_PKG_VERSION"))
}

#[tauri::command]
pub fn is_store_open() -> bool {
    false
}

#[derive(Debug, Serialize)]
pub struct AccountSummary {
    pub id: String,
    pub email: String,
    pub provider: String,
}

#[tauri::command]
pub fn list_accounts() -> Vec<AccountSummary> {
    Vec::new()
}

// V0.5: rust-core is linked. We expose `parse_raw` as a real command that
// returns ParsedMail; the heavy IMAP/SMTP operations are still gated behind
// V0.6 (real account creation flow). Other operations remain stubbed for
// now since they need a fully-initialised Store + Worker context.
const NOT_YET: &str = "Mail sync not yet integrated — coming in V0.6 (rust-core compiles in V0.5).";

#[tauri::command]
pub fn parse_raw(raw: Vec<u8>) -> Result<serde_json::Value, String> {
    let parsed = teddy_mail_core::parser::parse(&raw).map_err(|e| e.to_string())?;
    serde_json::to_value(&parsed).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn open_store(_path: String, _passphrase: String) -> Result<(), String> {
    Err(NOT_YET.into())
}

#[tauri::command]
pub fn search(_query: String, _limit: usize) -> Result<Vec<String>, String> {
    Err(NOT_YET.into())
}

#[tauri::command]
pub fn mark_read(_mail_id: String, _read: bool) -> Result<(), String> {
    Err(NOT_YET.into())
}

#[tauri::command]
pub fn snooze(_mail_id: String, _until_unix: i64) -> Result<(), String> {
    Err(NOT_YET.into())
}

#[tauri::command]
pub fn send_mail(_args: serde_json::Value) -> Result<(), String> {
    Err(NOT_YET.into())
}

// ---------------- OAuth ----------------

#[derive(Debug, Serialize, Deserialize)]
pub struct OAuthStartArgs {
    pub provider: String,
    pub client_id: String,
    pub redirect_uri: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OAuthStartResult {
    pub auth_url: String,
    pub state_token: String,
    pub code_verifier: String,
}

/// Build a PKCE auth URL. Pure logic, no backend store needed.
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

    let mut url = url::Url::parse(auth_endpoint).map_err(|e| e.to_string())?;
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

/// Exchange the authorization code for tokens. The tokens would be persisted
/// via the rust-core keyring helper in V0.2; for V0.1.0 we just verify the
/// exchange succeeds and let the UI know.
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
        .map_err(|e| e.to_string())?;

    let json: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    if json.get("access_token").and_then(|v| v.as_str()).is_none() {
        return Err(format!("token response missing access_token: {json}"));
    }
    tracing::info!(account = %args.account_id, "OAuth completed; token persistence in V0.2");
    Ok(())
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
