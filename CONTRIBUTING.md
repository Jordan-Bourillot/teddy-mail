# Contributing to Teddy Mail

## Stack en bref

- **Frontend** : React 19 + TypeScript strict + Tailwind 3 + Vite 6
- **State** : Zustand v5 (avec `useShallow` pour les sélecteurs dérivés)
- **Tests** : Vitest + jsdom (111 unit tests) + cargo test (4 tests)
- **Backend** : Rust 1.95 + tokio + tokio-util compat + async-imap + lettre + rusqlite/SQLCipher + mail-parser
- **Shell** : Tauri 2 + tauri-plugin-{shell, dialog, os, updater, process}

## Setup

### Prérequis

| Outil | Version min | Pourquoi |
|---|---|---|
| Node.js | 20 | UI + tests |
| Rust | 1.85 | rust-core + shell Tauri |
| MSVC Build Tools | VS 2022 | Linker pour Windows |
| Windows SDK | 10.0.22621 | dbghelp.lib etc. |
| Strawberry Perl | 5.x | OpenSSL vendored pour SQLCipher |
| WiX | 3.14 | MSI bundles (auto-installé par Tauri) |
| NSIS | 3.11 | NSIS bundles (auto-installé par Tauri) |

### Installation Windows

```bash
# Rust
winget install Rustlang.Rustup -e

# MSVC + Windows SDK (~7 GB)
winget install Microsoft.VisualStudio.2022.BuildTools -e \
  --override "--quiet --wait \
    --add Microsoft.VisualStudio.Workload.VCTools \
    --add Microsoft.VisualStudio.Component.Windows11SDK.22621 \
    --add Microsoft.VisualStudio.Component.Windows11SDK.26100"

# Perl
winget install StrawberryPerl.StrawberryPerl -e

# Code source
git clone https://github.com/Jordan-Bourillot/teddy-mail.git
cd teddy-mail
npm install
```

### Installation macOS

```bash
brew install rustup-init
rustup-init
brew install perl    # already system on most macOS
git clone https://github.com/Jordan-Bourillot/teddy-mail.git
cd teddy-mail
npm install
```

### Installation Linux

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev \
  librsvg2-dev libsqlcipher-dev patchelf
git clone https://github.com/Jordan-Bourillot/teddy-mail.git
cd teddy-mail
npm install
```

## Lancer en dev

```bash
# UI seule (web preview, données fictives)
npm run dev    # http://localhost:5173

# UI desktop (avec backend Rust)
npm run tauri:dev    # ouvre la fenêtre native
```

## Tests

```bash
# TS unit tests (Vitest, 111 tests)
npm run test

# TypeScript strict typecheck (ne doit rien sortir)
npx tsc --noEmit

# Rust tests (4 tests)
cd rust-core && cargo test
cd src-tauri && cargo check
```

## Build production

Sur Windows, depuis le repo root :

```bash
# Charge les env vars du wrapper (vcvars + perl + cargo)
# puis bumper la version dans 3 endroits :
#   package.json, src-tauri/tauri.conf.json, src-tauri/Cargo.toml

# Builds signés (pour l'auto-updater)
export TAURI_SIGNING_PRIVATE_KEY=$(cat ~/.tauri/teddy-mail.key)
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD=""
cmd /c "scripts\build-env.bat npm run tauri:build -- --bundles nsis,msi"

# Sortie:
#   src-tauri/target/release/bundle/nsis/Teddy Mail_X.Y.Z_x64-setup.exe (+.sig)
#   src-tauri/target/release/bundle/msi/Teddy Mail_X.Y.Z_x64_en-US.msi (+.sig)
#   src-tauri/target/release/teddy-mail-shell.exe   (portable)
```

## Architecture

Voir [ARCHITECTURE.md](ARCHITECTURE.md) pour les diagrammes.

Quelques principes :

1. **L'UI ne touche jamais au réseau ni au disque directement.** Tout passe par `src/lib/ipc.ts` qui route soit vers Tauri (desktop) soit vers des mocks (web preview).
2. **Single source of truth = Zustand.** Pas de useState pour des données partagées.
3. **Sélecteurs dérivés = `useShallow`** sinon infinite re-render (cf. `visibleThreads()`).
4. **Toute action utilisateur = optimistic update.** L'UI répond en < 50 ms, le sync arrive après.
5. **localStorage versionné** : toutes les clés utilisent `-v1` pour permettre les migrations.
6. **rust-core indépendant.** Peut être testé en isolation avec `cargo test`.

## Structure

```
src/
  App.tsx                        Shell global, routing clavier
  components/
    Sidebar.tsx                  Comptes, vues, focus, panels (drafts/scheduled/insights/accounts)
    MailList.tsx                 Liste threads (vue classique)
    MailReader.tsx               Lecture (vue classique)
    AtelierView.tsx              Vue éditoriale (vue atelier)
    Composer.tsx                 Compositeur avec toolbar markdown, attachments, schedule
    QuickReply.tsx               Réponse inline avec chip suggestions
    LabelPicker.tsx              CRUD labels au survol d'un mail
    AccountsPanel.tsx            Profil + signature CRUD
    DraftsPanel.tsx              Brouillons persistés
    ScheduledPanel.tsx           Envois programmés
    Insights.tsx                 Stats locales
    TemplatesPanel.tsx           CRUD modèles canned
    TemplatePicker.tsx           Cmd+/ pour insérer un modèle
    SettingsPanel.tsx            Préférences globales (thème, raccourcis, vacation)
    CommandPalette.tsx           Cmd+K
    CheatSheet.tsx               ? : tous les raccourcis
    UpdateChecker.tsx            Bandeau auto-update
    ScheduledSendDispatcher.tsx  Worker JS qui fire les envois programmés
    NewMailSimulator.tsx         Mock arrivée nouveau mail (V0.6 = vrai IMAP)
    FindInMail.tsx               Cmd+F dans le lecteur
    Onboarding.tsx               Premier lancement
    Toast.tsx, StatusBar.tsx, Avatar.tsx, BulkActionBar.tsx
  lib/
    store.ts                     Zustand single store (la SSOT)
    ipc.ts                       Bridge Tauri ↔ React + mocks web
    smartSort.ts                 Classification déterministe (5 catégories)
    threading.ts                 JWZ avec fallback sujet
    search.ts                    DSL + Fuse.js fuzzy
    snooze.ts                    Presets temps + isSnoozeReady
    trackers.ts                  Détection pixels + neutralisation HTML
    themes.ts                    6 thèmes + densité + initiales avatar
    hotkeys.ts                   4 profils + matcher d'événements
    sounds.ts                    WebAudio embarqué
    insights.ts                  Calcul stats locales
    engagements.ts               Détection "Je t'envoie ça lundi"
    markdown.ts                  Petit subset md → HTML safe
    templates.ts                 Templates + variables + slash auto-expand
    attachments.ts               Helpers attachments + validation
    textStats.ts                 Word count + reading time
    replySuggestions.ts          Heuristiques chips contextuels
    imapPresets.ts               Auto-config 8 providers IMAP
    oauth.ts                     PKCE flow client
    panelStore.ts                Mini event-bus pour shortcuts → panels
    useMediaQuery.ts             Hook responsive

rust-core/
  src/lib.rs                     Erreurs, init logging
  src/auth.rs                    OAuth tokens dans keyring OS
  src/parser.rs                  MIME parsing safe (mail-parser)
  src/store.rs                   SQLite + SQLCipher + FTS5 + triggers
  src/imap_sync.rs               IDLE worker async, backoff exponentiel
  src/smtp.rs                    Envoi via lettre (XOAUTH2)
  src/commands.rs                Surface IPC vers Tauri

src-tauri/
  src/main.rs                    Entry point Tauri, plugins, registry
  src/commands.rs                Bridge entre IPC et rust-core
  tauri.conf.json                Config app (window, CSP, bundle, updater)
  capabilities/default.json      Permissions plugins
  icons/                         App icons (générées via scripts/generate_icons.mjs)

scripts/
  generate_icons.mjs             Source PNG → 32/128/128@2x/1024/.ico
  build-env.bat                  Wrapper Windows : vcvars + perl + cargo PATH

.github/workflows/
  ci.yml                         Lint + tests + cargo check sur PR/push
  release.yml                    Cross-OS build signé sur push de tag
```

## Conventions

- **Anti-slop** : pas de "leverage", "robust", "comprehensive". Voir [README.md](README.md) ton.
- **Commits** : message impératif au présent, pas de scope préfix (`Add X` plutôt que `feat: add X`).
- **Tests** : un test par feature publique, plus property-tests sur le parser MIME.
- **Pas de console.log** dans le code commit. Utiliser `tracing` côté Rust, `console.warn` côté TS uniquement pour les vrais warnings utilisateurs.
- **Pas de TODO** sans issue ou ticket associé. Utiliser `// V0.6:` ou `// V1.0:` pour marquer le futur.

## Releases

1. Bump version dans `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`.
2. Mettre à jour `CHANGELOG.md` (entrée la plus haute, pas en bas).
3. Build local signé (cf section Build production).
4. Push commit + tag `vX.Y.Z`.
5. `gh release create vX.Y.Z --notes-file RELEASE_NOTES_vX.Y.Z.md ...assets...`
6. Vérifier le `latest.json` est bien dans la release pour l'auto-updater.

## License

MPL-2.0 — voir [LICENSE](LICENSE).
