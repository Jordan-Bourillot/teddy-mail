# Teddy Mail v0.5.1 — Triskell Studio branding

Habillage aux couleurs Triskell Studio.

## Ce qui change

### Logo à fond transparent
Le logo (ours blanc, lunettes roses) est maintenant détouré : plus de fond carré pastel.
- Sur la barre des tâches Windows, sur le bureau et dans le menu Démarrer, c'est l'ours seul qui apparaît, sur transparence.
- Le multi-size .ico (16/32/48/64/128/256) garantit un rendu net à toutes les tailles d'icône Windows.
- Pipeline : `scripts/generate_icons.mjs` détecte les pixels quasi-blancs (R/G/B > 240) et leur applique alpha 0.

### Nouveau thème par défaut : Triskell clair
Palette officielle Triskell Studio importée du Lanceur :
- Indigo principal `#7c7fe9` (CTA, accent)
- Violet `#a78bfa`, orange `#f97316` (en pastille de marque)
- Or `#d4b35a` (réservé aux titres nobles, V0.6+)
- Surfaces `#e9ecf2 / #ffffff / #f3f4f8`, bordures `#d4d7e0`, texte `#14171f`

Sélecteur dans **⚙ Préférences → Apparence** : « Triskell clair » est par défaut. Le thème blanc neutre reste dispo sous « Clair neutre ».

### Lien Triskell Studio
Dans la barre du bas à droite, après ⌘K, une pastille tricolore (indigo→violet→orange) + texte « Triskell Studio » qui ouvre [https://triskell.studio](https://triskell.studio) au clic. Utilise le navigateur système en mode desktop, un nouvel onglet en mode web.

## Auto-update — déjà en place
Pour info, l'auto-update est wired depuis **v0.2.0** :
- `tauri-plugin-updater` 2.0
- Vérification toutes les 6h sur GitHub releases
- Signature minisign embarquée (clé publique dans `tauri.conf.json`)
- Bandeau d'invite dans le coin bas-gauche
- Installer + redémarrer en 2 clics

Tes utilisateurs v0.2.0+ recevront cette v0.5.1 automatiquement dans les 6h après le premier lancement.

## Tests
- Vitest : 111 / 111
- TypeScript strict : 0 erreur
- Cargo test : 4 / 4

## Install
| File | Use |
|---|---|
| **Teddy Mail_0.5.1_x64-setup.exe** (NSIS) | recommandé |
| **Teddy Mail_0.5.1_x64_en-US.msi** | déploiement IT |
| **teddy-mail-shell.exe** | portable |

License: MPL-2.0
