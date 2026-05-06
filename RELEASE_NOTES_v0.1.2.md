# Teddy Mail v0.1.2

Branding fix: official logo embedded.

## What changed

- **Icon**: now uses the official Teddy Mail mascot (white bear with pink round glasses, navy blue line art) imported from the Triskell Studio Pirate Life Mail asset library. This is the icon that appears in the Windows taskbar, desktop shortcut, Start menu, and app window.
- The icon I generated in v0.1.1 (a different bear sketch) has been replaced.
- Icon generation pipeline (`scripts/generate_icons.mjs`) reworked to source from the official PNG and produce a multi-size .ico (16/32/48/64/128/256) plus the Tauri-required 32, 128, 128@2x sizes.

## Install

| File | Use |
|---|---|
| **Teddy Mail_0.1.2_x64-setup.exe** (NSIS) | recommended |
| **Teddy Mail_0.1.2_x64_en-US.msi** | enterprise / silent install |
| **teddy-mail-shell.exe** | portable, no install |

## What's next

V0.2: rust-core API drift fixes, IMAP IDLE wired to UI, OAuth keyring persistence, SQLCipher store, macOS/Linux release pipeline.

License: MPL-2.0
