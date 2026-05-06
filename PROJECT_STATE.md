# PROJECT_STATE — Teddy Mail

État courant : **V0.5.0 — UI feature-complete, Rust core compile et linké au shell desktop, prêt pour V0.6 (vraie sync mail).**

## Phases livrées

### Phase 1 — Spec et fondations
- [x] Spécification produit (4 axes : enrichissement, fiabilité, perso, UX/UI)
- [x] Plan technique (stack Tauri + React + Rust)

### Phase 2 — Implémentation V0.1 web
- [x] Scaffolding Vite + React 19 + TS strict + Tailwind + Vitest
- [x] Logique métier : store Zustand, smartSort, threading JWZ, search DSL, snooze, trackers, themes, hotkeys, undoSend, engagements
- [x] Composants : Sidebar, MailList, MailReader, Composer, CommandPalette, StatusBar, Toast, SettingsPanel, Avatar
- [x] Tests : 38 → progressivement 111 → finale 111

### Phase 3 — Onboarding + scaffold Tauri/OAuth + provider IMAP générique + Insights
- [x] Onboarding 90s, shell Tauri, IPC bridge web/desktop
- [x] OAuth PKCE Gmail/Outlook + écran AddAccount
- [x] Insights view (stats locales, temps gagné)
- [x] Reduced motion + sound packs (WebAudio)

### Phase 4 — Productivité, raccourcis, responsive (V0.2.x)
- [x] Multi-select avec actions groupées (archiver, snooze, supprimer)
- [x] Cheat sheet (?), command palette (Cmd+K)
- [x] Save current search as view + CRUD vues
- [x] Snooze date personnalisée
- [x] Layout responsive mobile

### Phase 5 — Profil + auto-update + drag-drop attachments (V0.2.x)
- [x] Édition signature, photo profil, nom affiché par compte
- [x] Auto-update via tauri-plugin-updater (clé minisign générée, builds signés)
- [x] Drag-and-drop pièces jointes avec preview images, validation 25 Mo/fichier

### Phase 6 — Writing experience (V0.3.0)
- [x] Markdown toolbar (B/I/code/lists/quote/link) + Cmd+B/I/K
- [x] Templates avec variables, picker (Cmd+/), gestionnaire CRUD
- [x] Slash auto-expand `/dispo`
- [x] Schedule send (presets + datetime picker, persistance, dispatcher 30s)
- [x] Auto-save during typing (debounced 2s)
- [x] Word count + reading time

### Phase 7 — Reader pane upgrades (V0.3.1)
- [x] Forward action (Transférer + F)
- [x] Quick reply inline below thread
- [x] Find in mail (Cmd+F) avec highlight et navigation
- [x] Snooze countdown sur les cards

### Phase 8 — Inbox management (V0.3.2)
- [x] Reply All (Shift+R) avec dedup automatique
- [x] Saved view CRUD (rename/delete depuis sidebar)
- [x] Mock new-mail simulator (5 min, respect quiet hours)
- [x] Labels CRUD avec chips colorés sur threads

### Phase 9 — Atelier view (V0.4.0)
- [x] **Vue alternative éditoriale** : hero card + clusters par catégorie en masonry
- [x] Toggle Classique/Atelier dans sidebar
- [x] Couleurs catégories en tinte douce (6%)
- [x] Click-to-expand inline, hover-revealed actions
- [x] Salutation contextuelle au temps qu'il fait

### Phase 10 — UX polish (V0.4.1)
- [x] Quick reply chip suggestions (heuristiques contextuelles meeting/thanks/question/request)
- [x] Composer minimize/expand
- [x] Vacation responder (UI + statut bar 🌴)
- [x] Atelier kbd nav (j/k/Enter)

### Phase 11 — Rust core compile (V0.5.0) — **À FOND**
- [x] **rust-core compile cleanly** : 16 → 0 erreurs
- [x] tokio-util compat bridge pour futures AsyncRead/Write
- [x] `tokio::TcpStream → .compat() → futures-stream → async-native-tls → async-imap`
- [x] async-imap Authenticator trait satisfait
- [x] Cargo test : 4/4 passants (parser MIME safe, store SQLCipher, FTS5, snooze)
- [x] **rust-core re-linké dans src-tauri** (était commenté depuis V0.1.0)
- [x] `parse_raw` exposé comme command Tauri réelle (pas stub) — l'UI peut maintenant parser un mail RFC822 via IPC
- [x] Documentation complète (PROJECT_STATE, ARCHITECTURE, CHANGELOG, CONTRIBUTING)

## Métriques

- **111 tests TypeScript** + **4 tests Rust** = **115 tests verts**
- **TypeScript strict** sans erreur
- **rust-core cargo check** sans erreur (1 warning unused import bénin)
- **Builds signés** Windows NSIS + MSI + portable .exe
- **Auto-update fonctionnel** sur la chaîne v0.2.0 → v0.5.0

## V0.5.0 inclut (récap des features visibles)

### Compose
- Multi-comptes IMAP / OAuth Gmail / OAuth Outlook (UI prêt, sync V0.6)
- Markdown toolbar + raccourcis
- Templates avec variables et auto-expand /shortcut
- Drag-drop pièces jointes (25 Mo/file, 50 Mo/mail)
- Auto-save 2s + warn pièce jointe oubliée
- Schedule send avec presets et datetime custom
- Composer minimize/expand
- Cmd+Entrée envoie avec window d'annulation 5/10/30s
- Vacation responder (UI configurée)

### Read
- Threading JWZ + fallback sujet
- Reply / Reply All / Forward / Quick reply inline
- Quick reply chip suggestions contextuelles
- Markdown rendering pour mails plain-text reçus
- Find in mail (Cmd+F) avec highlight
- Print mail (Cmd+P) avec CSS print-friendly
- Engagements détectés (FR/EN)
- Trackers neutralisés au render + compteur

### Inbox
- Vue Classique (3 panes) ou Atelier (éditorial single-pane)
- Multi-select + bulk archive/snooze/delete/markRead
- Search DSL (`from:` `has:` `is:` `before:` `after:`) + Fuse.js fuzzy
- Save search as view, rename, delete
- Snooze avec presets + custom datetime + countdown sur cards
- Labels CRUD avec chips colorés
- Insights (stats locales, top expéditeurs, temps gagné)
- Drafts panel persistant
- Scheduled panel avec annulation
- Mock new-mail simulator

### Customization
- 6 thèmes (clair, sombre, sépia, solarized, contraste, nocturne)
- 3 densités, taille police 12-18px
- 4 profils clavier (teddy, gmail, outlook, mutt)
- Reduced motion (auto/always/never)
- Sound packs WebAudio (off/subtle/crisp)
- Photo de profil, nom affiché, couleur d'accent par compte
- Signature multi-ligne avec preview
- Quiet hours pour notifications

### Desktop
- App Tauri 2 native (10 Mo binaire, ~50 Mo RAM)
- Auto-update minisign-signé via GitHub releases
- Notifications navigateur natives quand permission accordée
- Installeurs NSIS (4 Mo) + MSI (5.9 Mo) + portable .exe (15 Mo)
- Layout responsive (desktop / mobile-like sous 900px)

## Architecture validée

```
React (UI)
    ↓ Zustand (single store)
    ↓ ipc.ts (Tauri.invoke avec mocks web fallback)
    ↓
Rust shell (src-tauri)
    ├─ tauri 2 + plugins (shell, dialog, os, updater, process)
    └─ teddy_mail_core (lib)
         ├─ parser.rs   ← mail-parser, count_tracker_pixels
         ├─ store.rs    ← rusqlite + SQLCipher + FTS5 + triggers
         ├─ imap_sync.rs ← tokio + tokio-util compat + async-imap IDLE
         ├─ smtp.rs     ← lettre + XOAUTH2
         ├─ auth.rs     ← keyring OS, OAuth tokens
         └─ commands.rs ← surface IPC
```

## Reste pour V0.6 (vrai mail)

- Wire `ImapWorker` au store frontend (event stream → Zustand)
- Vraie création de compte IMAP/SMTP qui authentifie + démarre le worker
- OAuth deep-link callback (`tauri-plugin-deep-link`)
- Lecture/envoi/archive depuis le store SQLite chiffré au lieu du mock
- Migration des localStorage existants vers le store SQLite
- Tests E2E Playwright sur les parcours critiques

## Reste pour V1.0 (publique)

- macOS + Linux signed builds via GitHub Actions
- Code signing Authenticode Windows (~300€/an EV cert)
- Apple Developer notarization (~99€/an)
- Pricing et licence finalisés
- Site web / landing page
- Tests utilisateurs réels (50 entretiens)
- Marketing et lancement

## Dette technique restante

- 1 warning bénin "unused import: CoreError" dans rust-core (pas bloquant)
- mail-parser API : mes structs `ParsedMail` sont sérialisables mais le retour de `parse_raw` doit être typé côté TS (nominal `serde_json::Value` accepté pour V0.5)
- Drafts data URLs strippées à la persistance (recharge attachments avant envoi)
- Tests E2E Playwright pas encore en place (couvert par les 111 unit tests)

## Quick reprise

```bash
# UI seule (mode démo)
npm install
npm run dev      # http://localhost:5173

# Tests TS
npm run test      # 111 verts

# Tests Rust
cd rust-core && cargo test  # 4 verts (depuis V0.5.0)

# App desktop complète
npm run tauri:dev   # nécessite Rust + MSVC + perl (Windows)

# Build production signé
export TAURI_SIGNING_PRIVATE_KEY=$(cat ~/.tauri/teddy-mail.key)
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD=""
npm run tauri:build -- --bundles nsis,msi
```
