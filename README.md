# Pite Lafe Mail

Client mail calme, souverain, profondément personnalisable.

> **Statut** : prototype V1, exécution en mode UI seul (mocked data). Le cœur Rust est scaffolded mais pas encore branché à Tauri.

## Pourquoi

- Gmail = puissance + tracking publicitaire.
- Outlook = lourdeur entreprise.
- ProtonMail = chiffrement austère.
- Hey = workflow opinionné, peu personnalisable.

Pite Lafe vise le créneau **personnalisation profonde + plaisir d'usage + souveraineté des données**.

## Stack

| Couche | Choix |
|---|---|
| Shell desktop | Tauri 2 |
| UI | React 19 + TypeScript strict + Tailwind |
| State | Zustand |
| Recherche client | Fuse.js (V1) → SQLite FTS5 (V1.5) |
| Cœur sync | Rust : `async-imap`, `lettre`, `mail-parser` |
| Store | SQLite + SQLCipher |
| Auth | OAuth2 PKCE, keyring OS |

## Démarrage rapide (UI seule, sans backend)

```bash
npm install
npm run dev
```

Ouvre http://localhost:5173. La boîte est peuplée de données fictives : 8 mails, 2 comptes, des traceurs simulés.

## Tests

```bash
npm run test
```

Couvre : classification (smartSort), threading JWZ, recherche DSL, blocage traceurs, snooze, undo send, hotkeys, détection d'engagements.

## Structure

```
pite_lafe_mail/
├── src/
│   ├── App.tsx                # Shell 3 colonnes
│   ├── components/            # Sidebar, MailList, MailReader, Composer, CommandPalette, StatusBar, Toast, SettingsPanel, Avatar
│   ├── lib/                   # store, smartSort, threading, search, snooze, trackers, themes, hotkeys, undoSend, engagements, mockData
│   ├── styles/index.css       # Thèmes, densités, tokens CSS
│   └── types.ts               # Types domaine
├── rust-core/
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs             # Erreurs, logging
│       ├── auth.rs            # OAuth2 + keyring
│       ├── parser.rs          # MIME parsing safe
│       ├── store.rs           # SQLite/SQLCipher + FTS5
│       ├── imap_sync.rs       # Worker IMAP IDLE
│       ├── smtp.rs            # Envoi sortant
│       └── commands.rs        # Surface IPC Tauri
├── src-tauri/tauri.conf.json  # Config Tauri
├── PROJECT_STATE.md           # État courant et reprises
├── BACKLOG.md                 # Idées hors scope V1
└── README.md
```

## Fonctionnalités V1 implémentées (UI + logique)

- Vue 3 colonnes (sidebar + liste + lecteur).
- Tri intelligent local par catégories (work, personal, notifications, newsletters, promotions).
- Threading JWZ avec fallback sujet.
- Recherche DSL : `from:`, `to:`, `subject:`, `label:`, `is:unread|starred|snoozed`, `has:attachment|trackers|engagement`, `before:`, `after:` + recherche floue Fuse.js.
- Blocage de pixels traceurs et sanitization HTML (DOMPurify).
- Détection d'engagements ("Je t'envoie ça vendredi").
- Snooze avec presets (ce soir, demain, weekend, lundi, semaine, un jour).
- Undo Send (5/10/30s configurable) avec annulation toast.
- Compositeur avec auto-save, alerte pièce jointe oubliée, raccourci Cmd+Entrée.
- Palette de commandes (Cmd+K) avec actions et résultats mêlés.
- 6 thèmes (clair, sombre, sépia, solarized, contraste, nocturne) + densité (compact/cozy/spacious) + taille de police.
- 4 profils clavier (pite, gmail, outlook, mutt).
- Mode focus.
- Statut bas avec compteurs.

## Fonctionnalités Rust core (skeleton, non encore appelé depuis l'UI)

- Worker IMAP IDLE async par compte avec backoff exponentiel.
- Authentification XOAUTH2 + IMAP simple.
- Store SQLite chiffré (SQLCipher) avec FTS5 et triggers.
- Parser MIME tolérant aux mails malformés.
- Envoi SMTP via lettre.

## Sécurité et vie privée

- Tous les contenus locaux sont chiffrés au repos (SQLCipher, dérivation de clé depuis passphrase ou keyring OS).
- Pixels traceurs détectés et neutralisés au rendu.
- Images distantes bloquées par défaut (configurable : toujours / expéditeurs de confiance / jamais).
- HTML rendu après passage par DOMPurify, scripts/iframes interdits.
- OAuth tokens dans le keyring OS (Credential Manager / Keychain / libsecret).
- Aucun envoi de télémétrie sans opt-in explicite.

## Licence

À définir avant lancement public. Candidat principal : MPL-2.0 (modifiable côté code, copyleft sur le fichier).
