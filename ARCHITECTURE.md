# Architecture — Pite Lafe Mail

## L'app : web aujourd'hui, desktop bientôt

Pite Lafe est conçu comme une **application desktop native**, mais qui se développe et se prévisualise dans un navigateur web.

### Trois modes d'exécution depuis le même code

```
┌──────────────────────────────────────────────────────────────────┐
│  SOURCE                                                          │
│  ├─ src/         React + TypeScript (UI, logique métier)         │
│  ├─ rust-core/   Rust (sync IMAP, parser MIME, store SQLite)     │
│  └─ src-tauri/   Shell Tauri (bridge IPC + packaging)            │
└──────────────────────────────────────────────────────────────────┘
                          │
       ┌──────────────────┼─────────────────────────┐
       ▼                  ▼                         ▼
┌────────────┐    ┌────────────────┐      ┌──────────────────┐
│ npm run    │    │ npm run        │      │ npm run          │
│ dev        │    │ tauri:dev      │      │ tauri:build      │
└────────────┘    └────────────────┘      └──────────────────┘
       │                  │                         │
       ▼                  ▼                         ▼
   Navigateur         Fenêtre native           Installeur signé
   (mocks IPC)        (Rust connecté)          (.exe / .dmg / etc.)
```

### 1. Mode dev navigateur — `npm run dev`

C'est ce qui tourne actuellement sur `http://localhost:5173`.

- Vite sert le React directement dans Chrome/Firefox.
- Les appels IPC (`ipc.ts`) détectent l'absence de Tauri et utilisent des **mocks** : données fictives, OAuth simulé, store en mémoire.
- **Avantage** : itération rapide, aucun besoin d'installer Rust (~1.5 Go de toolchain).
- **Limite** : pas de vraie sync IMAP, pas de chiffrement local persistant, pas de stockage de credentials.

### 2. Mode dev desktop — `npm run tauri:dev`

Nécessite Rust installé (rustup.rs, ~5 min).

- Tauri compile `rust-core` + le shell, ouvre une fenêtre native, charge le React dedans.
- Les appels IPC vont **vraiment** vers le Rust : sync IMAP réelle, store SQLite chiffré dans le dossier OS, tokens OAuth dans le keyring.
- HMR fonctionne toujours pour le code TS/React.
- **Avantage** : exactement ce que verra l'utilisateur final, plus toutes les capacités natives.

### 3. Mode prod — `npm run tauri:build`

- Compile en release, signe les binaires, génère les installateurs.
- **Sortie** :
  - Windows : `Pite Lafe Mail-0.1.0-setup.exe` + `.msi` (~12 Mo)
  - macOS : `Pite Lafe Mail.app` + `.dmg` (~8 Mo, signé/notarisé pour distribution)
  - Linux : `.AppImage` portable + `.deb` (~10 Mo)
- L'utilisateur final installe ça → l'app apparaît dans le menu démarrer / Dock / launcher → fenêtre native, aucun navigateur visible.

## Pourquoi Tauri et pas Electron ?

| | Electron | Tauri 2 |
|---|---|---|
| Footprint binaire | 80–150 Mo | 8–15 Mo |
| RAM idle | 200–400 Mo | 50–100 Mo |
| Embarque Chromium | oui | non, utilise la webview système |
| Cœur natif | Node.js | Rust (mémoire-safe) |
| Maturité écosystème | très haute | bonne, en croissance |

Tauri 2 utilise WebView2 sur Windows, WebKit sur macOS, WebKitGTK sur Linux. Pas de runtime embarqué, donc binaire 10x plus petit, RAM 4x moindre.

## Couches et responsabilités

### Couche UI (`src/`)

```
src/
├── App.tsx              # Shell : header + sidebar + 2 panes + statut
├── components/
│   ├── Sidebar.tsx          # Comptes, vues sauvegardées, focus, insights, ajout compte
│   ├── MailList.tsx         # Liste des threads, multi-select, badges
│   ├── BulkActionBar.tsx    # Actions groupées sur sélection multiple
│   ├── MailReader.tsx       # Lecture, snooze (presets + custom), réponse
│   ├── Composer.tsx         # Édition, auto-save, alerte PJ oubliée
│   ├── CommandPalette.tsx   # ⌘K : recherche + actions mêlées
│   ├── CheatSheet.tsx       # ? : tous les raccourcis filtrables
│   ├── SettingsPanel.tsx    # Préférences complètes
│   ├── AddAccount.tsx       # OAuth Gmail/Outlook + IMAP générique
│   ├── Insights.tsx         # Stats locales, temps gagné
│   ├── Onboarding.tsx       # 3 écrans, 90s
│   ├── Toast.tsx, StatusBar.tsx, Avatar.tsx
└── lib/
    ├── store.ts             # Zustand : single source of truth
    ├── ipc.ts               # Bridge Tauri ↔ React, mocks web
    ├── oauth.ts             # PKCE flow client
    ├── smartSort.ts         # Classification déterministe local
    ├── threading.ts         # JWZ + fallback sujet
    ├── search.ts            # DSL + Fuse.js fuzzy
    ├── trackers.ts          # Détection pixels + neutralisation
    ├── snooze.ts            # Presets + helpers temps
    ├── undoSend.ts          # Buffer envoi avec annulation
    ├── engagements.ts       # Détection "Je t'envoie ça lundi"
    ├── insights.ts          # Calcul stats locales
    ├── sounds.ts            # WebAudio embarqué + reduced motion
    ├── themes.ts            # Palette + densité + initiales avatar
    ├── hotkeys.ts           # 4 profils clavier (pite/gmail/outlook/mutt)
    ├── imapPresets.ts       # 8 providers IMAP/SMTP courants
    ├── useMediaQuery.ts     # Responsive hook
    └── mockData.ts          # Données démo
```

### Couche cœur Rust (`rust-core/`)

```
rust-core/src/
├── lib.rs           # Erreurs, init logging
├── auth.rs          # OAuth tokens dans keyring OS
├── parser.rs        # MIME parsing safe (mail-parser)
├── store.rs         # SQLite + SQLCipher + FTS5 + triggers
├── imap_sync.rs     # Worker IDLE async, backoff exponentiel
├── smtp.rs          # Envoi via lettre
└── commands.rs      # Surface IPC exposée à Tauri
```

### Couche shell Tauri (`src-tauri/`)

```
src-tauri/
├── Cargo.toml       # Dépendances shell : tauri 2, plugins, sha2, oauth
├── build.rs         # Hook tauri-build
├── tauri.conf.json  # Config app (titre, taille, CSP, bundle targets)
└── src/
    ├── main.rs          # Entry point, état partagé, registre handlers
    └── commands.rs      # 11 commands #[tauri::command] : greet, open_store,
                         # search, mark_read, snooze, send_mail,
                         # start_oauth, complete_oauth, list_accounts, parse_raw
```

## Flux d'une action utilisateur

Exemple : "Archiver un mail" en mode desktop.

1. L'utilisateur appuie sur `E` dans la fenêtre.
2. Le handler clavier dans `App.tsx` appelle `store.archive([mailId])`.
3. Le store met à jour l'état React **instantanément** (optimistic update). L'UI réagit en moins de 50 ms.
4. En parallèle, `store.archive` appelle `ipc.invoke('mark_read'...)` ou similaire.
5. `ipc.ts` détecte qu'on est dans Tauri → forward à `window.__TAURI_INTERNALS__.invoke`.
6. Le shell Tauri reçoit le message, route vers la command Rust `mark_read`.
7. La command verrouille le `Store`, met à jour la ligne SQLite chiffrée.
8. Une autre tâche async pousse l'opération sur la file `sync_queue`.
9. Le worker IMAP voit la nouvelle entrée, envoie un `STORE +FLAGS \Seen` au serveur.
10. À tout moment, si étape 8/9 échoue : la file persistante retentera. L'UI ne sait rien. L'utilisateur ne voit jamais de spinner réseau.

## Sécurité par défaut

- **Tout chiffré au repos** : SQLCipher avec clé dérivée d'une passphrase (saisie au démarrage) ou via le keyring OS.
- **HTML mail sandboxé** : iframe sandbox sans JS, sans cookies, sans réseau, sanitizé via DOMPurify.
- **Trackers neutralisés** par défaut : pixels 1×1 et domaines connus stripés au render.
- **OAuth tokens en keyring OS** : Credential Manager (Win), Keychain (Mac), libsecret (Linux). Jamais sur disque en clair.
- **Pas de télémétrie** sans opt-in explicite.
- **CSP stricte** dans `tauri.conf.json` : aucun script externe, aucune ressource inline non-style.

## Pour passer en mode desktop

```bash
# 1. Installer Rust (une fois)
# Windows : https://rustup.rs/ → exécutable rustup-init.exe
# macOS/Linux : curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 2. Vérifier
cargo --version

# 3. Lancer en dev
npm run tauri:dev

# 4. Construire un installeur
npm run tauri:build
# → ./src-tauri/target/release/bundle/
```

Première compilation Rust : ~5 min (compile toutes les deps). Recompilations incrémentales : ~10 s.

## Limitations connues

- En mode web (npm run dev), la sauvegarde de comptes ajoutés est en mémoire seulement (perdue au refresh).
- L'OAuth réel ne fonctionne qu'en desktop (le flow PKCE nécessite un redirect URI desktop, pas un loopback web).
- Le shell Rust n'a pas encore été compilé sur cette machine (Rust toolchain absente). Le code TS est validé par `tsc --noEmit` et 48 tests Vitest.
- L'API `mail-parser` doit être validée à la première compile (signatures peuvent diverger entre versions mineures).
