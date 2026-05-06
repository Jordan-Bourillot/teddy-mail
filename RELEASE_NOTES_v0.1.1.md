# Teddy Mail v0.1.1

Product rename release.

## What changed

The product was renamed from **Pite Lafe Mail** to **Teddy Mail**. Functionally identical to v0.1.0, but with the new identity end-to-end.

### Updated
- Product name and bundle id (`studio.triskell.teddy-mail`)
- Window title, npm package name, Rust crate names
- All UI strings (Sidebar tagline, Onboarding header, status bar)
- Default keyboard profile renamed `pite` → `teddy`
- localStorage keys (`teddy-mail-prefs-v1`, `teddy-mail-onboarded-v1`)
- Deep link scheme: `teddymail://oauth-callback`
- Keyring service name for token storage

### Fixed
- Snooze "Tonight 18h" preset now rolls to tomorrow if 18h has already passed today (was returning a past date, breaking the "snooze must point to the future" invariant)

### Migration note for v0.1.0 users
- Preferences stored under `pite-lafe-prefs-v1` are NOT migrated. If you customized themes, density or shortcuts in v0.1.0, you'll need to redo them in v0.1.1.
- This trade-off is acceptable since v0.1.0 had no real users yet (released same day).

## Install

Same options as v0.1.0:

| File | Use |
|---|---|
| **Teddy Mail_0.1.1_x64-setup.exe** (NSIS) | recommended for most Windows users |
| **Teddy Mail_0.1.1_x64_en-US.msi** | enterprise / silent install |
| **teddy-mail-shell.exe** | portable, runs without installation |

## What's next

V0.2 still on track:
- Resolve `rust-core` API drift and wire IMAP IDLE
- OAuth token persistence in OS keyring
- SQLCipher encrypted local store
- macOS and Linux release pipeline

License: MPL-2.0
