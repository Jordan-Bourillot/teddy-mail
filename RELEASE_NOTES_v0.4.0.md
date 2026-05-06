# Teddy Mail v0.4.0 — Atelier view

A second mail interface that doesn't look like all the others.

## What's new

### Vue Atelier
A toggleable single-pane editorial layout, alternative to the classic 3-column inbox.

- **Hero card** at the top: the most important unread mail of the day (work or personal), shown full with subject as headline, large avatar, generous body excerpt, and primary action buttons. Sized to draw attention.
- **Category clusters**: the rest of the day's mail grouped under soft headers (Travail, Personnel, Notifications, Newsletters, Promotions). Each shown as a masonry of compact cards (3 columns on desktop, 1 on mobile).
- **Category color tint**: each card carries a subtle 6%-opacity tint of the category's accent color, so categories are felt rather than read.
- **Click any card to expand inline** — the body unfolds underneath without navigating away. Click again to collapse.
- **Hover-revealed actions** on every card: Répondre / Archiver / Snooze / Favori. No always-visible chrome.
- **Time-of-day greeting** in the header. "Bonjour", "Bon après-midi", "Bonsoir", or "Belle nuit" depending on local time, with your first name when it's set.
- **Empty state** : "Boîte vide. Le calme est précieux."

### Switching
- Sidebar now has a Classique / Atelier toggle right under the "Écrire" button.
- Persists per user (saved in `teddy-mail-prefs-v1`).
- Tools you already know (Composer, Compose palette ⌘K, Cheat sheet `?`, Drafts, Scheduled, Insights, all keyboard shortcuts) still work in Atelier — just the inbox layout changes.

## Why
Mail clients all look like Gmail. Three columns, dense rows, big toolbar. We wanted a layout that feels less like an inbox to triage and more like a quiet morning paper to read. The hero + clusters pattern is borrowed from editorial design (newspaper front page), adapted to single-user reading.

## Auto-update
v0.3.x users get this automatically.

| File | Use |
|---|---|
| **Teddy Mail_0.4.0_x64-setup.exe** (NSIS) | recommended |
| **Teddy Mail_0.4.0_x64_en-US.msi** | enterprise |
| **teddy-mail-shell.exe** | portable |

License: MPL-2.0
