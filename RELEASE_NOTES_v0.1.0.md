# Pite Lafe Mail v0.1.0

First public release. Calm, sovereign, deeply customizable mail client for desktop.

## What's in this release

This release ships the **complete desktop UI** as a native app. The mail-sync backend (real IMAP/JMAP, encrypted local store) is decoupled from this build and lands in V0.2.

You can:
- Open the app, walk through the 90-second onboarding, pick a theme (6 to choose from)
- Explore the full inbox experience with realistic mock data
- Use every keyboard shortcut, multi-select, snooze with custom dates, save searches as views
- Test the OAuth flow end-to-end (the URL is generated; tokens are exchanged with Google/Microsoft; storage in OS keyring lands in V0.2)
- Toggle reduced motion, sound packs, accent colors, font size, density

You cannot yet:
- Receive or send real mail (V0.2)
- Sync IMAP/JMAP (V0.2)
- Persist accounts and tokens to keyring (V0.2)
- Use SQLite/SQLCipher local store (V0.2)

## Highlights

### UI
- 3-column desktop layout, fully responsive (single-pane below 900 px)
- 6 themes (light, dark, sepia, solarized, contrast, nocturne) with live preview
- 4 keyboard profiles (pite, gmail, outlook, mutt)
- Multi-select with bulk archive/snooze/delete
- Cheat sheet (?), command palette (Cmd+K), insights view

### Privacy
- Tracker pixels neutralized at render time
- HTML mail rendered through DOMPurify
- No telemetry, no tracking, no analytics
- All preferences and state stored locally in localStorage

### Quality
- TypeScript strict, 48 Vitest tests passing
- Rust core (`rust-core/`) scaffolded with parser, store, IMAP sync, OAuth — 16 known API-drift errors against newer crate versions to be fixed in V0.2

## Install

Download the appropriate file for your OS from the assets below.

- **Windows**: `Pite Lafe Mail_0.1.0_x64-setup.exe` (NSIS installer) or `_0.1.0_x64_en-US.msi`
- **macOS**: `.dmg` — coming via GitHub Actions release workflow
- **Linux**: `.AppImage` or `.deb` — coming via GitHub Actions release workflow

## What's next (V0.2)

- Resolve API drift in `rust-core`: async-imap → futures compat, mail-parser API, async wrappers
- Wire IMAP IDLE worker to the UI via Tauri IPC
- Persist accounts and tokens via OS keyring
- SQLCipher encrypted local store for mail bodies and indexes
- `tauri-plugin-deep-link` for OAuth callback automation
- Drag-and-drop attachments
- Cross-platform release pipeline (macOS, Linux) via GitHub Actions

## Repo

- Source: https://github.com/Jordan-Bourillot/pite-lafe-mail
- Architecture details: [ARCHITECTURE.md](ARCHITECTURE.md)
- Backlog and known limitations: [BACKLOG.md](BACKLOG.md)
- Detailed state: [PROJECT_STATE.md](PROJECT_STATE.md)

License: MPL-2.0
