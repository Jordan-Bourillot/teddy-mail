# Teddy Mail v0.2.1

Drag-and-drop attachments in the Composer.

## What's new

- **Drag-and-drop attachments**: drop one or many files anywhere on the Composer window. Visual cue while dragging.
- **Attach button** (📎) in the Composer footer, with a counter when files are attached.
- **Attachment chips** below the body: filename, size, image preview thumbnail (PNG/JPG/WebP/GIF under 1.5 MB), one-click remove.
- **Limits**: 25 MB per file, 50 MB total per email. Validation messages via toast.
- Send confirmation now mentions attachment count: *"Envoyé avec 2 pièce(s) jointe(s)"*.

## Quality
- 11 new Vitest tests for attachment helpers (size formatting, validation, glyph picking)
- **Total: 58 tests passing**
- TypeScript strict still clean
- Builds signed with the v0.2.0 updater key — auto-update from v0.2.0 will work

## Install
Auto-update from v0.2.0 will pick this up automatically. If you're on v0.1.x, download manually:

| File | Use |
|---|---|
| **Teddy Mail_0.2.1_x64-setup.exe** (NSIS) | recommended |
| **Teddy Mail_0.2.1_x64_en-US.msi** | enterprise / silent |
| **teddy-mail-shell.exe** | portable |

License: MPL-2.0
