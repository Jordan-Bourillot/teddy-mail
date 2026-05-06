# Changelog

All notable changes to Teddy Mail are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning [SemVer](https://semver.org).

## [Unreleased]

## [0.3.0] — 2026-05-06

Big feature drop: writing experience.

### Added

#### Composer
- **Markdown toolbar** with B / I / `</>` / list / ordered list / blockquote / link buttons. Cmd+B / Cmd+I / Cmd+K shortcuts.
- **Templates / canned responses**: 3 defaults (dispo, merci, relance), full CRUD via Settings → Modèles. Cmd+/ opens the picker. Variable expansion ({{first_name}}, {{my_name}}, {{my_email}}, {{date}}, {{time}}).
- **Slash command auto-expand**: typing `/dispo ` (slash + shortcut + space) expands inline with variables substituted.
- **Drag-and-drop attachments** anywhere on the compose window, with image previews, 25 MB per file / 50 MB per mail validation.
- **Auto-save during typing** (debounced 2s). Footer shows green dot + "Sauvegardé HH:MM:SS".
- **Schedule send**: split button ▾ with presets (demain 9h, lundi 8h, +2h) + custom datetime picker. Persistent queue, mock dispatcher fires when time comes.
- **Writing stats** in footer: word count + estimated reading time at 220 wpm.

#### Inbox
- **Drafts panel** in sidebar with count badge. List sorted by recency, click to resume, hover to delete.
- **Scheduled panel** in sidebar with count badge. Lists pending sends with countdown.
- **Print mail** (🖨 button + Cmd+P) with print-friendly CSS that hides chrome.

#### Reader
- **Markdown rendering** for received plain-text mails (lists, bold, italic, links auto-expanded). Sanitized via DOMPurify, URL allowlist (http/https/mailto only).

#### Keyboard
- **Gmail-style g+key navigation**: g d → Drafts, g s → Scheduled, g i → Insights, g a → Accounts, g n → Add account.
- All new shortcuts listed in the cheat sheet (?).

### Changed
- Default keyboard profile renamed pite → teddy (consistency with the rebrand).
- closeCompose toast: "Brouillon enregistré" instead of silent.

### Quality
- TypeScript strict throughout
- **111 tests** passing (added: markdown × 14, attachments × 11, templates × 14, drafts × 6, textStats × 7)

### Migration
- Auto-update from v0.2.x: just click "Installer" when the banner pops up.
- Existing localStorage keys (prefs, accounts, drafts, scheduled, templates) all use versioned suffixes.

## [0.2.1] — 2026-05-06

### Added
- **Drag-and-drop attachments** in the Composer. Drop files anywhere on the compose window, or click 📎 to pick. Visual cue while dragging.
- Attachment chips: filename, size, image preview thumbnail (for PNG/JPG/WebP/GIF under 1.5 MB), one-click remove.
- Per-file limit: 25 MB. Per-mail total: 50 MB. Validation messages via toast.
- Send confirmation now mentions attachments count: "Envoyé avec 2 pièce(s) jointe(s)".
- 11 new Vitest tests covering size formatting, validation, and glyph picking. **Total: 58 tests passing.**



### Added
- **Profile editor** with per-account photo upload (JPG/PNG/WebP, compressed to 320px / 250KB max), display name, accent color, and signature editor with live preview.
- **Auto-update**: `tauri-plugin-updater` integrated. Desktop app checks GitHub releases every 6 h, shows a non-blocking banner. Install + restart in two clicks. Minisign-style signature verification (public key embedded, private key never shipped).
- `teddy-mail-accounts-v1` localStorage key persists account customizations across reloads.
- Composer footer warns when active account has no signature configured.
- Updater signing keypair generated and added to GitHub Secrets for CI signing.
- `latest.json` updater manifest published with each release.

### Changed
- Account list in sidebar now shows the user's avatar and is clickable (opens the Accounts panel).
- Avatar component supports photo URLs (data URL or http) with initials fallback.
- Release workflow signs all updater artifacts (`.exe`, `.msi`, `.dmg`, `.AppImage`) and generates `latest.json`.

## [0.1.2] — 2026-05-06

### Changed
- Icon switched to the official Teddy Mail mascot (white bear with pink round glasses) sourced from the Triskell Studio asset library.
- `scripts/generate_icons.mjs` reworked to source from the official PNG and produce a multi-size `.ico` (16/32/48/64/128/256) for crisp Windows rendering at every zoom level.

## [0.1.1] — 2026-05-06

### Changed
- **Renamed product to Teddy Mail** (was Pite Lafe Mail).
  - Bundle id: `studio.triskell.teddy-mail`
  - Window title, npm package, Rust crates, all UI strings updated.
  - Default keyboard profile renamed `pite` → `teddy`.
  - localStorage keys renamed; first-run users on upgrade lose preferences (acceptable: V0.1.0 had no real users yet).

### Fixed
- `snooze.ts` "Tonight 18h" preset now rolls to tomorrow if 18h has already passed today (it previously returned a past date, which broke the future-only invariant).

## [0.1.0] — 2026-05-06

First public release.

### Added

#### Core mail experience
- Multi-account UI (IMAP / OAuth Gmail / OAuth Outlook)
- 3-column layout with responsive single-pane below 900 px
- Smart sort with transparent rules (work / personal / notifications / newsletters / promotions)
- JWZ threading with subject-fallback grouping
- Search DSL (`from:` `to:` `subject:` `label:` `is:` `has:` `before:` `after:`) + Fuse.js fuzzy
- Snooze with 6 presets and custom datetime picker
- Tracker pixel detection and neutralization at render time (DOMPurify sandbox)
- Engagement detection ("Je t'envoie ça vendredi")
- Undo Send (5 / 10 / 30 s configurable, with toast cancel)
- Drafts auto-save every 3 s, attachment-mention warning before send

#### Productivity
- Multi-select with bulk archive / snooze / delete / mark read
- Save current search as a sidebar view in one click
- Command palette (Cmd+K) mixing actions and mail results
- Cheat sheet (?) listing every shortcut, filterable, grouped
- 4 keyboard profiles (teddy, gmail, outlook, mutt) with full per-action remap
- Insights view: weekly volume, trend, trackers blocked, time saved, top senders, category breakdown

#### Personalization
- 6 themes (light, dark, sepia, solarized, high-contrast, nocturne) with live preview
- 3 densities (compact, cozy, spacious) and font-size slider 12-18 px
- Reduced motion preference (auto / always / never)
- WebAudio sound packs (off / subtle / crisp) on archive / snooze / send
- Tracker block toggle per provider

#### Onboarding
- 90-second first-run flow: theme → account → shortcuts
- Skippable, persisted in localStorage

#### Architecture
- Tauri 2 desktop shell scaffolded (Cargo.toml, main.rs, commands.rs)
- Rust core: async-imap IDLE worker, mail-parser MIME parsing, SQLCipher store with FTS5, OAuth PKCE, SMTP via lettre
- IPC bridge with web fallback (mocks) so npm run dev works without Rust
- 11 Tauri commands exposed
- CSP strict, no inline scripts

#### Quality
- TypeScript strict, 48 Vitest tests across 10 suites
- Property-style coverage on parser, threading, search, classification
- GitHub Actions CI (lint + test) and Release (cross-OS bundle on tag)
- MPL-2.0 license

### Known limitations
- mail-parser API to validate at first compile (signatures may diverge)
- Composer fixed bottom-right; full-window mode in V1.1
- OAuth callback requires manual code paste; deep-link plugin in V1.1
- Provider iCloud OAuth not yet wired
