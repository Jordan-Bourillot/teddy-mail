# Teddy Mail v0.2.0

Three product gaps closed: signature editor, profile photo, auto-update.

## What's new

### Profile editor (per account)
Click your account email in the sidebar (or the new ⚙ that appears on hover) to open the **Comptes** panel.

You can now edit per account:
- **Profile photo**: upload JPG/PNG/WebP, automatically compressed to 320 px / max 250 KB and stored locally as a data URL. Photo replaces the initials avatar everywhere it shows up.
- **Display name**: appears in the "From" field of sent mail
- **Accent color**: color picker for the sidebar swatch
- **Signature**: full-text editor with live preview, line counter, multi-line support

Persisted in `localStorage` (V0.2 desktop) and survives reload. Will move to the encrypted SQLite store in V0.3.

### Auto-update
The desktop app now checks GitHub releases every 6 h on launch and shows a non-blocking banner (bottom-left) when a new version is available.

- Click **Installer** → downloads + verifies signature + applies
- Click **Redémarrer** → app relaunches into the new version
- Click **Plus tard** → dismissed for the session

Powered by `tauri-plugin-updater` with minisign-style signature verification. Public key embedded in the binary, private key held only by Triskell Studio (never shipped). Update payloads that don't verify are rejected — no man-in-the-middle even on a compromised network.

### Other improvements
- Composer footer warns when the active account has no signature configured, with a hint to fix it
- Account changes (add, edit) survive page reload via a new `teddy-mail-accounts-v1` localStorage key
- Avatar component now renders photos when present, falls back gracefully on load error

## Migration from v0.1.x

- Settings are preserved.
- The OAuth flow paths haven't changed.
- The first launch of v0.2.0 won't trigger an update check until the v0.3.x release.

## Install

| File | Use |
|---|---|
| **Teddy Mail_0.2.0_x64-setup.exe** (NSIS) | recommended. Auto-update will activate automatically. |
| **Teddy Mail_0.2.0_x64_en-US.msi** | enterprise / silent install |
| **teddy-mail-shell.exe** | portable, no install. **Auto-update only works for the installed builds (NSIS / MSI).** |

## What's next (V0.3)

- Wire `rust-core` (resolve futures/tokio compat, IMAP IDLE running)
- Persist accounts and tokens in the OS keyring instead of localStorage
- SQLCipher encrypted local store for mails and indexes
- macOS and Linux signed builds via the GHA workflow
- Drag-and-drop attachments

License: MPL-2.0
