//! MIME parsing wrapper around `mail-parser`.
//!
//! Goal: every malformed mail still yields a usable record with a plain-text
//! fallback, never panics, never crashes the worker.

use crate::{CoreError, CoreResult};
use mail_parser::{Message, MessageParser, MimeHeaders};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedAddress {
    pub name: Option<String>,
    pub email: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedAttachment {
    pub filename: String,
    pub mime_type: String,
    pub size_bytes: u64,
    pub content_hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedMail {
    pub message_id: Option<String>,
    pub in_reply_to: Option<String>,
    pub references: Vec<String>,
    pub from: ParsedAddress,
    pub to: Vec<ParsedAddress>,
    pub cc: Vec<ParsedAddress>,
    pub subject: String,
    pub body_text: String,
    pub body_html: Option<String>,
    pub date_unix: i64,
    pub attachments: Vec<ParsedAttachment>,
    pub raw_headers: String,
    pub trackers_blocked: u32,
}

pub fn parse(raw: &[u8]) -> CoreResult<ParsedMail> {
    let msg: Message = MessageParser::default()
        .parse(raw)
        .ok_or_else(|| CoreError::Parser("could not parse message".into()))?;

    let from = msg
        .from()
        .and_then(|addrs| addrs.first())
        .map(|a| ParsedAddress {
            name: a.name().map(|s| s.to_string()),
            email: a.address().unwrap_or("").to_string(),
        })
        .unwrap_or(ParsedAddress {
            name: None,
            email: "".to_string(),
        });

    let collect_addrs = |list: Option<&mail_parser::Address>| -> Vec<ParsedAddress> {
        list.map(|addrs| {
            addrs
                .iter()
                .map(|a| ParsedAddress {
                    name: a.name().map(|s| s.to_string()),
                    email: a.address().unwrap_or("").to_string(),
                })
                .collect()
        })
        .unwrap_or_default()
    };

    let to = collect_addrs(msg.to());
    let cc = collect_addrs(msg.cc());

    let subject = msg.subject().unwrap_or("(sans objet)").to_string();

    let body_text = msg.body_text(0).map(|s| s.to_string()).unwrap_or_default();
    let body_html = msg.body_html(0).map(|s| s.to_string());

    let date_unix = msg
        .date()
        .map(|d| d.to_timestamp())
        .unwrap_or(chrono::Utc::now().timestamp());

    let mut attachments = Vec::new();
    for att in msg.attachments() {
        let bytes = att.contents();
        let mut hasher = Sha256::new();
        hasher.update(bytes);
        let hash = hex::encode(hasher.finalize());
        attachments.push(ParsedAttachment {
            filename: att
                .attachment_name()
                .unwrap_or("unnamed")
                .to_string(),
            mime_type: att
                .content_type()
                .map(|c| format!("{}/{}", c.ctype(), c.subtype().unwrap_or("")))
                .unwrap_or_else(|| "application/octet-stream".to_string()),
            size_bytes: bytes.len() as u64,
            content_hash: hash,
        });
    }

    let raw_headers = msg
        .headers_raw()
        .map(|(k, v)| format!("{k}: {v}"))
        .collect::<Vec<_>>()
        .join("\n");

    let message_id = msg.message_id().map(|s| s.to_string());
    let in_reply_to = msg.in_reply_to().as_text_list().and_then(|v| v.first().map(|s| s.to_string()));
    let references = msg
        .references()
        .as_text_list()
        .map(|v| v.iter().map(|s| s.to_string()).collect())
        .unwrap_or_default();

    let trackers_blocked = body_html
        .as_deref()
        .map(count_tracker_pixels)
        .unwrap_or(0);

    Ok(ParsedMail {
        message_id,
        in_reply_to,
        references,
        from,
        to,
        cc,
        subject,
        body_text,
        body_html,
        date_unix,
        attachments,
        raw_headers,
        trackers_blocked,
    })
}

/// Count likely tracker pixels in raw HTML. Mirror of TS `neutralizeTrackers`.
fn count_tracker_pixels(html: &str) -> u32 {
    let mut count = 0u32;
    for chunk in html.split("<img") {
        let lower = chunk.to_ascii_lowercase();
        let tiny = lower.contains("width=\"1\"")
            || lower.contains("width='1'")
            || lower.contains("height=\"1\"")
            || lower.contains("height='1'")
            || lower.contains("width:1px")
            || lower.contains("height:1px");
        if tiny {
            count += 1;
        }
    }
    count
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_minimal_message_does_not_panic() {
        let raw = b"From: a@b.fr\r\nSubject: hi\r\n\r\nbody";
        let parsed = parse(raw).unwrap();
        assert_eq!(parsed.subject, "hi");
        assert_eq!(parsed.from.email, "a@b.fr");
    }

    #[test]
    fn parse_garbage_returns_error_not_panic() {
        let _ = parse(b"\xFF\xFF not a mail \xFF\xFF");
        // either Ok with mostly-empty fields, or a typed CoreError::Parser, never panic
    }

    #[test]
    fn count_tracker_pixels_basic() {
        let html = r#"<p>hi</p><img src="x" width="1" height="1"><img src="y" width="500">"#;
        assert_eq!(count_tracker_pixels(html), 1);
    }
}
