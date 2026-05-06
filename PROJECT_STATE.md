# PROJECT_STATE — Pite Lafe Mail

État courant : **V1 web complet + scaffold Tauri/OAuth + Insights + multi-select + cheat sheet + responsive mobile.**

## Étapes terminées

### Phase 1 — Spec et fondations
- [x] Spécification produit (4 axes : enrichissement, fiabilité, perso, UX/UI)
- [x] Plan technique (stack, archi, sprints)

### Phase 2 — Implémentation V1 web
- [x] Scaffolding (Vite + React 19 + TS strict + Tailwind + Vitest)
- [x] Types domaine (`src/types.ts`)
- [x] Mock data (8 mails, 2 comptes)
- [x] Logique métier : store Zustand, smartSort, threading JWZ, search DSL, snooze, trackers, themes, hotkeys (4 profils), undoSend, engagements
- [x] Composants : Sidebar, MailList, MailReader, Composer, CommandPalette, StatusBar, Toast, SettingsPanel, Avatar
- [x] Shell App.tsx avec routing clavier global
- [x] Cœur Rust scaffold : auth, parser, store SQLCipher+FTS5, imap_sync IDLE, smtp, commands
- [x] Tests Vitest (8 suites) + tests Rust (parser, store)
- [x] Fix bug rendu : `useShallow` sur les sélecteurs renvoyant des tableaux dérivés

### Phase 3 — Onboarding et intégration desktop
- [x] **Onboarding 90s** : 3 écrans (thème + previews live, ajout compte, raccourcis), persistance `localStorage`
- [x] **Shell Tauri** : `src-tauri/Cargo.toml`, `main.rs`, `commands.rs`, `build.rs`
- [x] **Bridge IPC** (`src/lib/ipc.ts`) : détection Tauri vs web, fallback mocks, wrappers typés
- [x] **OAuth PKCE** : helpers TS + commands Rust (`start_oauth`, `complete_oauth`) avec S256 côté Rust
- [x] **Écran AddAccount** OAuth (Gmail/Outlook)

### Phase 5 — Productivité, raccourcis, responsive
- [x] **Multi-select** dans MailList : checkbox au hover, bascule clic, bordure accent quand sélectionné
- [x] **BulkActionBar** : compteur, "Tout sélectionner", Archiver, Lus, Snooze (presets + custom datetime), Supprimer
- [x] **Raccourcis bulk** : `Cmd/Ctrl+A` sélectionne tout visible, `Esc` désélectionne, `E`/`#` archivent/suppriment la sélection si présente
- [x] **CheatSheet** (`?`) : overlay listant tous les raccourcis groupés (Navigation, Action mail, Composition, Recherche, Aide), filtrage texte, mention du profil clavier actif
- [x] **Sauvegarde de recherche** : bouton ★ Sauver dans la liste quand une recherche est active, ajoute une vue persistante dans la sidebar
- [x] **Snooze date personnalisée** : datetime-local input dans MailReader et BulkActionBar, en plus des 6 presets
- [x] **Layout responsive** : `useIsNarrow` (≤900px), Sidebar en drawer derrière hamburger, navigation single-pane (liste OU lecteur), bouton retour `←` dans le header
- [x] **ARCHITECTURE.md** : explication détaillée web/desktop, diagrammes, flux d'action, sécurité

### Phase 4 — Provider IMAP générique, Insights, a11y/sons
- [x] **AddAccount IMAP/SMTP générique** avec auto-détection du provider via `imapPresets.ts` (Free, Orange, SFR, La Poste, Proton Bridge, Fastmail, Mailbox.org)
- [x] **Action `addAccount`** dans le store : crée 5 dossiers par défaut (inbox, sent, drafts, archive, trash), refuse les doublons par id ou email
- [x] **Vue Insights** (`Insights.tsx` + `insights.ts`) : mails cette semaine, trend %, traceurs neutralisés, temps gagné estimé, répartition par catégorie avec barres, top 5 expéditeurs
- [x] **Préférence reducedMotion** (auto/always/never) avec listener sur changement OS
- [x] **Sound pack** (off/subtle/crisp) via WebAudio API embarquée — joué sur send, archive, snooze
- [x] **Settings** étendus avec section Mouvement et son
- [x] **Bug fix** : regex de détection d'engagements FR cassée sur l'apostrophe (`t'envoie` n'était pas matché). Réécrite, gère apostrophe droite ET typographique.
- [x] **Dette résolue** : crate `futures = "0.3"` réelle ajoutée à `rust-core/Cargo.toml`, shim retiré de `imap_sync.rs`.
- [x] Tests Vitest étendus : `insights.test.ts` (5 tests), `imapPresets.test.ts` (5 tests). **Total : 48 tests passent.**
- [x] TypeScript `tsc --noEmit` passe en strict.

## Étape en cours

Aucune. Toutes étapes du plan livrées.

## Reprises possibles

1. **Compiler le shell Tauri** : `cd src-tauri && cargo build`. Nécessite Rust toolchain. Première compilation ~5 min.
2. **Brancher la sync IMAP réelle** : une fois `cargo build` ok, lancer `npm run tauri:dev`, le store SQLite chiffré sera créé dans le `app_data_dir` OS, et le worker IDLE peut être lancé depuis une command.
3. **OAuth réel** : enregistrer une app dans Google Cloud Console (Gmail) ou Microsoft Entra (Outlook), récupérer le client_id, le coller dans l'écran AddAccount. La redirect URI `pitelafe://oauth-callback` nécessite l'enregistrement d'un deep-link via `tauri-plugin-deep-link` (à ajouter en V1.5).
4. **Migration Fuse.js → SQLite FTS5** : remplacer `searchMails` côté TS par `ipc.search()` quand `isStoreOpen()` est vrai.
5. **Mobile** : factoriser les modules TS partageables (logique pure, pas de DOM) puis bridger via React Native + UniFFI Rust.

## Décisions structurantes

- **No proprietary OAuth secrets in Pite Lafe** → chaque utilisateur enregistre sa propre app OAuth, en garde le contrôle. Évite les rate limits partagés et la dépendance à un compte centralisé. Friction onboarding +1 min, ratio acceptable pour la cible "souverains".
- **Web fallback systématique** sur l'IPC : `ipc.ts` détecte `window.__TAURI_INTERNALS__`, sinon route vers des mocks. Le mode `npm run dev` reste fonctionnel pour développement et démo.
- **PKCE côté Rust** : code_challenge SHA256 calculé dans la command `start_oauth`, pas dans le renderer. Token exchange aussi côté Rust pour ne jamais exposer le refresh token au JS.
- **Onboarding non bloquant** : "Passer la configuration" disponible à tout moment, l'app marche en données fictives sans compte.

## Hypothèses non encore vérifiées

- Le tri intelligent par règles atteint > 85 % d'accord avec le tri manuel utilisateur.
- L'utilisateur cible accepte de créer sa propre app OAuth (vs friction zéro Gmail/Outlook officiel).
- Onboarding 90s tient effectivement en 90s (à mesurer en user test).

## Risques identifiés

- Tauri 2.x encore jeune ; plan B Electron documenté.
- Parsing MIME = source #1 de bugs ; fuzzing à mettre en place avant V1 publique.
- Flow OAuth deep-link nécessite plugin Tauri + handler URI scheme par OS — pas trivial sur Windows.
- `mail-parser` API a évolué entre versions ; signatures à valider à la première compile.

## Dette / TODOs reportés

- Compile Rust core et shell : nécessite Rust toolchain (cargo absent sur cette machine). À valider à la première install.
- `mail-parser` API : signatures à vérifier sur la version réelle (`headers_raw`, `as_text_list`).
- Ajout `tauri-plugin-deep-link` pour recevoir le redirect OAuth automatiquement (au lieu du paste manuel du code).
- Drag-out pièces jointes : nécessite Tauri command file system.
- Composer fixed bottom-right : ajouter mode pleine-fenêtre.
- AddAccount : provider iCloud OAuth (V1.1).
- Validation IMAP/SMTP credentials avant ajout (test connexion en Tauri).
- Tests E2E Playwright sur les parcours critiques.
- Signature/notarization 3 OS dans GitHub Actions.
- Pricing et licence à finaliser.

## Reprise rapide

```bash
# UI seule (mode démo)
npm install
npm run dev      # http://localhost:5173

# Tests TS
npm run test

# App desktop complète (Rust toolchain requise)
npm run tauri:dev

# Build production
npm run tauri:build
```
