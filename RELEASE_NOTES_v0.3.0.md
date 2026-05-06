# Teddy Mail v0.3.0

The writing experience release. Six features that turn the inbox-only V0.2.x into a real authoring tool.

## What's new

### Composer

- **Markdown toolbar** above the body : bold / italic / code / link / unordered list / ordered list / blockquote. Buttons toggle around the current selection. Shortcuts: ⌘B, ⌘I, ⌘K (link).
- **Templates / canned responses** : Settings → Modèles to manage. Three defaults included (Disponibilités, Remerciement, Relance). Variables `{{first_name}}` / `{{my_name}}` / `{{my_email}}` / `{{date}}` / `{{time}}` substituted on insert.
  - **⌘/** opens the picker (filter, arrow nav, Enter to insert).
  - Or type `/dispo ` (slash + shortcut + space) directly in the body for inline auto-expand.
- **Drag-and-drop attachments** anywhere on the compose window. Image previews under 1.5 MB. 25 MB per file / 50 MB per mail.
- **Auto-save while typing** (2 s debounced). Footer shows ● Sauvegardé HH:MM:SS.
- **Schedule send** (split button ▾ next to Envoyer) with three presets (demain 9h, lundi prochain 8h, +2h) and a custom datetime picker. Persistent queue, mock dispatch fires when time comes.
- **Writing stats** : word count + estimated reading time (220 wpm).

### Inbox and reader

- **Brouillons** sidebar entry with count badge. Click any draft to resume; hover to delete.
- **Programmés** sidebar entry with countdown. Cancel any scheduled send.
- **Print mail** : 🖨 button next to Répondre, or ⌘P. Print-friendly CSS hides the chrome.
- **Markdown rendering for plain-text mails** in the reader so received messages with `**bold**` / lists / links display nicely. Sanitized through DOMPurify with strict URL allowlist.

### Keyboard

- **Gmail-style `g + key` navigation** : `g d` → Drafts, `g s` → Scheduled, `g i` → Insights, `g a` → Accounts, `g n` → Add account.
- Cheat sheet (?) lists everything new.

### Quality

- TypeScript strict throughout
- **111 tests** passing (vs 58 in v0.2.1) — coverage for markdown rendering, attachments, templates, drafts, text stats, slash expansion.
- Builds signed with the same key as v0.2.x — auto-update will pick this up.

## Auto-update

If you're on **v0.2.0 or v0.2.1**, the in-app updater will offer this version automatically within 6 hours of launch (or now if you wait through the 6 h check).

If you're on **v0.1.x**, you'll need to download the new installer manually from below.

## Install

| File | Use |
|---|---|
| **Teddy Mail_0.3.0_x64-setup.exe** (NSIS) | recommended |
| **Teddy Mail_0.3.0_x64_en-US.msi** | enterprise / silent install |
| **teddy-mail-shell.exe** | portable, no install |

## What's next (V0.4)

- Wire `rust-core` (resolve futures/tokio compat, IMAP IDLE running) — unlocks real mail
- Persist accounts and tokens via OS keyring
- SQLCipher encrypted local store
- macOS / Linux signed builds via the GHA workflow

License: MPL-2.0
