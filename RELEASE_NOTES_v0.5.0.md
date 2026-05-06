# Teddy Mail v0.5.0 — Rust core linked

The Rust mail backend now compiles cleanly and is linked into the desktop shell. The UI gains zero new visible features in this release; what changed is **under the hood**, paving the way for V0.6 where real IMAP sync replaces the mocks.

## Why this matters

Since v0.1.0 the React UI has shipped a complete experience on mock data, while `rust-core` (the Rust crate doing IMAP / SMTP / SQLCipher / OAuth) was kept on the side because of API drift between `tokio` and `async-imap`. v0.5.0 closes that gap:

- **16 → 0 cargo errors** in `rust-core` after bridging tokio/futures via `tokio_util::compat::TokioAsyncReadCompatExt`.
- **`async-imap`'s Authenticator trait** now satisfied with the right by-value pass.
- **`teddy_mail_core` re-linked into `src-tauri/Cargo.toml`** — it had been commented out since v0.1.0.
- **`parse_raw` exposed as a real Tauri command** that returns the parsed RFC822 mail (subject, from, attachments, trackers blocked count) so the UI can dogfood the parser today.

Other rust-core surface (IMAP IDLE worker, encrypted store, OAuth helpers, SMTP) stays gated behind V0.6 because they need the full account-creation flow and Store init. They compile, they're tested, they're reachable from the shell.

## Changed

- `rust-core/Cargo.toml`: added `tokio-util = { version = "0.7", features = ["compat"] }`.
- `rust-core/src/imap_sync.rs`: cleaner architecture comment + tokio→futures compat bridge applied to `TcpStream` before TLS + before passing to `async-imap`.
- `src-tauri/Cargo.toml`: `teddy_mail_core` dependency uncommented.
- `src-tauri/src/main.rs`: `parse_raw` registered in the invoke handler list.
- `src-tauri/src/commands.rs`: `parse_raw` is now a real implementation calling `teddy_mail_core::parser::parse`. NOT_YET error message updated to mention V0.6.

## Tests

- **TypeScript strict** : 0 errors.
- **Vitest** : 111 / 111 passing.
- **Cargo test rust-core** : 4 / 4 passing (parser, store, fuzzing edge cases).
- **115 tests verts au total.**

## Documentation

Three docs comprehensively updated:
- [PROJECT_STATE.md](PROJECT_STATE.md) — full phase log, V0.1 → V0.5.
- [ARCHITECTURE.md](ARCHITECTURE.md) — diagrams, layer responsibilities.
- **NEW** [CONTRIBUTING.md](CONTRIBUTING.md) — full developer onboarding (Windows / macOS / Linux setup, conventions, release process).

## Auto-update

Users on v0.4.x get this automatically.

| File | Use |
|---|---|
| **Teddy Mail_0.5.0_x64-setup.exe** (NSIS) | recommended |
| **Teddy Mail_0.5.0_x64_en-US.msi** | enterprise |
| **teddy-mail-shell.exe** | portable |

## What's next (V0.6)

- Wire `ImapWorker` event stream to the React store
- Real account creation flow that authenticates + starts the worker
- Migrate localStorage drafts/scheduled/templates into the SQLCipher store
- Real SMTP send replacing the mock toast in QuickReply / Composer
- `tauri-plugin-deep-link` for OAuth callback automation
- E2E Playwright tests on critical paths

License: MPL-2.0
