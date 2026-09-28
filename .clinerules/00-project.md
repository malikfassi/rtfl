# RTFL — instructions Cline

RTFL (« Read The Fucking Lyrics ») est un jeu quotidien de paroles masquées : une chanson par jour, le joueur devine des mots, chaque mot trouvé se révèle partout dans le texte, et la partie se gagne **en nommant la chanson et l'artiste** (règle de victoire du commit `99018b4`). Web seulement : Next.js 15 (App Router), React 18, Prisma/SQLite, Tailwind.

Cette configuration `.clinerules/` reprend le workflow multi-rôles du projet runassist (skills + workflows) en l'adaptant au web. C'est le seul emplacement de ce workflow ici : il n'y a pas de doublon `.claude/`.

## Lire en premier

`docs/STATUS.md` : où on en est, prochaine étape, décisions en attente. Ne pas ré-explorer ce qui y est écrit.
`docs/redesign-handover.md` : la référence de l'écran de jeu (design, fixtures, rickroll, pièges). À relire avant toute modification de l'interface.

## Où est quoi

- `src/app/front/` : l'interface du jeu (`components/game/`, `hooks/`, `lib/`, `globals.css`)
- `src/app/api/` : les routes et les services (`lib/services/`, `lib/clients/`, `lib/test/` pour les fixtures)
- `prisma/` : schéma, migrations, seed
- `tests/` : Playwright (e2e). Les tests Jest vivent à côté du code (`*.test.ts`).
- `docs/` : `STATUS.md`, `redesign-handover.md`, `plan/tasks.md`, `adr/`, `feedback/backlog.md`, analyses
- `.clinerules/skills/` : un dossier par rôle (`web-dev`, `reviewer`, `qa`) + connaissances (`web-conventions`)
- `.clinerules/workflows/` : procédures (`next-task`, `feedback`, `adr`, `handoff`)

## Modes Cline (voir `01-mode-routing.md`)

Un seul modèle actif par mode, Plan et Act. Charge le skill du rôle qui correspond à la tâche et reste dans le mode qu'il indique. `web-conventions` (connaissances) se charge d'elle-même dès qu'on touche au code.

## Règles

- **Une décision revient à Malik**, jamais à l'agent : question produit, design, interaction ou implémentation. L'agent pose la question, met la tâche en attente, et continue sur une autre tâche indépendante. Il n'invente jamais la réponse.
- Aucune dette technique, aucun contournement : on trouve la cause et on répare. Sinon, on s'arrête et on demande.
- Une décision structurante = un ADR court dans `docs/adr/` (workflow `adr`). Une décision acceptée ne se re-débat pas sans nouvel élément.
- Les retours de Malik sur le design passent par `docs/feedback/backlog.md` (workflow `feedback`), pas par un commentaire perdu dans le chat.
- Les textes affichés sont en anglais (c'est le produit) ; le code et les commentaires aussi ; l'agent parle français avec Malik.
- Petite modif : directement, en Act. Tâche du plan : workflow `next-task`. Nouveau retour : workflow `feedback`. Fin de session : workflow `handoff`.

## Pièges du projet (à ne pas réapprendre)

- **Jamais d'édition de fichier par one-liner shell** (`sed -i`, `perl -pi`, découpage Python). Malik lit les diffs : on édite par remplacement ancré, même si ça prend plusieurs passes. Le shell reste acceptable en lecture seule.
- **Jest écrase la base de dev.** Ne jamais lancer `pnpm jest` nu : passer une `DATABASE_URL` jetable (voir skill `qa`).
- **E2e : `PLAYWRIGHT_PORT=3100`.** Avec `reuseExistingServer` et un dev server sur :3000, la suite adopte *ce* serveur et déroule son global-setup (wipe + reseed) à travers.
- **`.env*` est gitignoré** (sauf `.env.example`). `.env.test` doit contenir `ADMIN_PASSWORD`, sinon le seed e2e prend un 401 sur `/api/admin/*`.
- **Le rickroll lit des fixtures à l'exécution** : cassé en build standalone (T-005).
- **Les mots masqués sont des underscores**, pas des barres vides : décision client, ne pas « corriger » (ADR-0002).
- **Les couleurs ne sont jamais des hex en dur dans les composants** : tokens CSS `rtfl-*` dans `globals.css`, exposés dans `tailwind.config.ts`. Seule exception : les six teintes d'identité de mot dans `color-management.ts`.
