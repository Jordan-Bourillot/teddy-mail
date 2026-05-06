# Teddy Mail v0.4.1

UX polish across the writing and reading flow.

## What's new

### Quick reply chip suggestions
Below the inline reply box at the bottom of every thread, three contextual chips suggest a one-line answer:
- "Confirmé / Décaler ? / Lien Meet ?" if the mail mentions rendez-vous, RDV, réunion
- "Avec plaisir / De rien / Merci à toi" if the sender thanks or congratulates you
- "C'est parti / Plus tard / Détails ?" if the sender asks "peux-tu… / pourrais-tu…"
- "Oui ✓ / Pas dispo / Je regarde" for any other question
- "Merci ! / Bien noté / Je reviens vers toi" otherwise
Click a chip → instant send (mock in V0.4, real in V0.5). Click "Personnaliser…" to edit before sending.

### Composer minimize
The compose window now has a "—" button next to the close. Click → collapses to a thin bar showing the subject + recipient. Click the bar → restores. Useful when juggling a draft with reading another mail.

### Vacation responder
⚙ Préférences → "Réponse automatique (absence)". Toggle on, set a date range, customize subject and body. When active, a 🌴 Absence indicator shows in the status bar. Real out-of-office wiring lands in V0.5 with the SMTP layer.

### Atelier keyboard navigation
In Atelier view: `j/k` (or arrow keys) cycle the focused card across all clusters. The focused card gets an accent ring and auto-scrolls into view. `Enter` toggles the body expansion of the focused card. Esc and other shortcuts work as before.

## Auto-update
v0.4.0 users get this automatically.

| File | Use |
|---|---|
| **Teddy Mail_0.4.1_x64-setup.exe** (NSIS) | recommended |
| **Teddy Mail_0.4.1_x64_en-US.msi** | enterprise |
| **teddy-mail-shell.exe** | portable |

License: MPL-2.0
