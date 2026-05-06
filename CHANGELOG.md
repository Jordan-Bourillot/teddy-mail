# Changelog

All notable changes to Teddy Mail are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning [SemVer](https://semver.org).

## [Unreleased]

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
