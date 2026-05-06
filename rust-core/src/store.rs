//! Encrypted SQLite store with FTS5 search index.
//!
//! Schema is created on first open via `initialize`. Migrations live in a
//! single `schema_version` row, applied in `migrate`.

use crate::{parser::ParsedMail, CoreResult};
use rusqlite::{params, Connection, OptionalExtension};
use std::path::Path;

const SCHEMA: &str = r#"
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER NOT NULL PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    protocol TEXT NOT NULL,
    color TEXT NOT NULL,
    signature TEXT
);

CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    folder_type TEXT NOT NULL,
    uid_validity INTEGER,
    last_modseq INTEGER
);

CREATE TABLE IF NOT EXISTS mails (
    id TEXT PRIMARY KEY,
    thread_id TEXT,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    folder_id TEXT NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
    message_id TEXT,
    in_reply_to TEXT,
    references_blob TEXT,
    from_name TEXT,
    from_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_text TEXT NOT NULL,
    body_html TEXT,
    received_at INTEGER NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    starred INTEGER NOT NULL DEFAULT 0,
    category TEXT NOT NULL DEFAULT 'unsorted',
    snoozed_until INTEGER,
    trackers_blocked INTEGER NOT NULL DEFAULT 0,
    raw_headers TEXT,
    raw_blob_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_mails_thread ON mails(thread_id);
CREATE INDEX IF NOT EXISTS idx_mails_received ON mails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_mails_folder ON mails(folder_id);
CREATE INDEX IF NOT EXISTS idx_mails_account ON mails(account_id);

CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    mail_id TEXT NOT NULL REFERENCES mails(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    content_hash TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_attachments_mail ON attachments(mail_id);
CREATE INDEX IF NOT EXISTS idx_attachments_hash ON attachments(content_hash);

CREATE VIRTUAL TABLE IF NOT EXISTS mails_fts USING fts5(
    subject, body_text, from_name, from_email,
    content='mails', content_rowid='rowid'
);

CREATE TRIGGER IF NOT EXISTS mails_ai AFTER INSERT ON mails BEGIN
    INSERT INTO mails_fts(rowid, subject, body_text, from_name, from_email)
    VALUES (new.rowid, new.subject, new.body_text, new.from_name, new.from_email);
END;

CREATE TRIGGER IF NOT EXISTS mails_ad AFTER DELETE ON mails BEGIN
    INSERT INTO mails_fts(mails_fts, rowid, subject, body_text, from_name, from_email)
    VALUES ('delete', old.rowid, old.subject, old.body_text, old.from_name, old.from_email);
END;

CREATE TRIGGER IF NOT EXISTS mails_au AFTER UPDATE ON mails BEGIN
    INSERT INTO mails_fts(mails_fts, rowid, subject, body_text, from_name, from_email)
    VALUES ('delete', old.rowid, old.subject, old.body_text, old.from_name, old.from_email);
    INSERT INTO mails_fts(rowid, subject, body_text, from_name, from_email)
    VALUES (new.rowid, new.subject, new.body_text, new.from_name, new.from_email);
END;

CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id TEXT NOT NULL,
    op_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_account ON sync_queue(account_id, id);
"#;

pub struct Store {
    conn: Connection,
}

impl Store {
    /// Open or create the encrypted store at `path`. The passphrase is used
    /// to derive the SQLCipher key.
    pub fn open(path: &Path, passphrase: &str) -> CoreResult<Self> {
        let conn = Connection::open(path)?;
        conn.pragma_update(None, "key", passphrase)?;
        conn.pragma_update(None, "journal_mode", "WAL")?;
        conn.pragma_update(None, "synchronous", "NORMAL")?;
        conn.pragma_update(None, "foreign_keys", "ON")?;
        let store = Self { conn };
        store.initialize()?;
        Ok(store)
    }

    fn initialize(&self) -> CoreResult<()> {
        self.conn.execute_batch(SCHEMA)?;
        let current: Option<i64> = self
            .conn
            .query_row("SELECT version FROM schema_version", [], |r| r.get(0))
            .optional()?;
        if current.is_none() {
            self.conn
                .execute("INSERT INTO schema_version (version) VALUES (1)", [])?;
        }
        Ok(())
    }

    /// Insert or update a parsed mail.
    pub fn upsert_mail(&self, parsed: &ParsedMail, account_id: &str, folder_id: &str) -> CoreResult<String> {
        let id = parsed
            .message_id
            .clone()
            .unwrap_or_else(|| format!("local_{}_{}", account_id, parsed.date_unix));
        let refs = parsed.references.join(" ");
        self.conn.execute(
            "INSERT OR REPLACE INTO mails (
                id, thread_id, account_id, folder_id,
                message_id, in_reply_to, references_blob,
                from_name, from_email, subject, body_text, body_html,
                received_at, read, starred, category, trackers_blocked, raw_headers
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,COALESCE((SELECT read FROM mails WHERE id=?),0),COALESCE((SELECT starred FROM mails WHERE id=?),0),'unsorted',?,?)",
            params![
                id, id, account_id, folder_id,
                parsed.message_id, parsed.in_reply_to, refs,
                parsed.from.name, parsed.from.email, parsed.subject,
                parsed.body_text, parsed.body_html, parsed.date_unix,
                id, id,
                parsed.trackers_blocked as i64, parsed.raw_headers
            ],
        )?;
        for att in &parsed.attachments {
            self.conn.execute(
                "INSERT OR REPLACE INTO attachments (id, mail_id, filename, mime_type, size_bytes, content_hash)
                 VALUES (?,?,?,?,?,?)",
                params![
                    format!("{}_{}", id, att.content_hash),
                    id,
                    att.filename,
                    att.mime_type,
                    att.size_bytes as i64,
                    att.content_hash,
                ],
            )?;
        }
        Ok(id)
    }

    /// Full-text search returning mail ids ranked by FTS5 bm25.
    pub fn search(&self, query: &str, limit: usize) -> CoreResult<Vec<String>> {
        let mut stmt = self.conn.prepare(
            "SELECT m.id FROM mails_fts f
             JOIN mails m ON m.rowid = f.rowid
             WHERE mails_fts MATCH ?
             ORDER BY bm25(mails_fts) ASC
             LIMIT ?",
        )?;
        let rows = stmt.query_map(params![query, limit as i64], |r| r.get::<_, String>(0))?;
        let mut out = Vec::new();
        for row in rows {
            out.push(row?);
        }
        Ok(out)
    }

    pub fn mark_read(&self, mail_id: &str, read: bool) -> CoreResult<()> {
        self.conn.execute(
            "UPDATE mails SET read = ? WHERE id = ?",
            params![read as i64, mail_id],
        )?;
        Ok(())
    }

    pub fn snooze(&self, mail_id: &str, until_unix: i64) -> CoreResult<()> {
        self.conn.execute(
            "UPDATE mails SET snoozed_until = ? WHERE id = ?",
            params![until_unix, mail_id],
        )?;
        Ok(())
    }

    /// Push an operation to the sync queue. Workers will drain it.
    pub fn enqueue_op(&self, account_id: &str, op_type: &str, payload: &str) -> CoreResult<()> {
        self.conn.execute(
            "INSERT INTO sync_queue (account_id, op_type, payload, created_at) VALUES (?,?,?,?)",
            params![account_id, op_type, payload, chrono::Utc::now().timestamp()],
        )?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    fn fake_parsed() -> ParsedMail {
        ParsedMail {
            message_id: Some("<m1@x>".into()),
            in_reply_to: None,
            references: vec![],
            from: crate::parser::ParsedAddress {
                name: Some("Anna".into()),
                email: "anna@x.fr".into(),
            },
            to: vec![],
            cc: vec![],
            subject: "Hello".into(),
            body_text: "world".into(),
            body_html: None,
            date_unix: 1_700_000_000,
            attachments: vec![],
            raw_headers: String::new(),
            trackers_blocked: 0,
        }
    }

    #[test]
    fn open_creates_schema_and_inserts() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("store.db");
        let store = Store::open(&path, "test-pass").unwrap();
        store
            .conn
            .execute(
                "INSERT INTO accounts (id, email, display_name, protocol, color) VALUES ('a','x@y','X','imap','#000')",
                [],
            )
            .unwrap();
        store
            .conn
            .execute(
                "INSERT INTO folders (id, account_id, name, folder_type) VALUES ('f','a','Inbox','inbox')",
                [],
            )
            .unwrap();
        let id = store.upsert_mail(&fake_parsed(), "a", "f").unwrap();
        let hits = store.search("hello", 10).unwrap();
        assert_eq!(hits, vec![id]);
    }
}
