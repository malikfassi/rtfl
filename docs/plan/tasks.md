# Plan de tâches

Statuts : `à faire` / `en cours` / `fait` / `bloqué` / `attente-décision`. Une tâche `attente-décision` ne démarre pas tant que Malik n'a pas tranché ; on enchaîne alors sur une tâche indépendante.

| ID | Tâche | Type | Dépend de | Statut | Notes |
|---|---|---|---|---|---|
| T-001 | Strophes : appliquer la décision | produit + code | décision Malik | attente-décision | 3 options dans `docs/redesign-handover.md` §5 ; l'option backend exige un re-scrapage des chansons stockées |
| T-002 | Vérifier les polices du PNG de partage | code | - | à faire | `html-to-image` doit inliner les Google Fonts ; personne n'a regardé le PNG produit |
| T-003 | Styler les jours hors-mois du calendrier | code | - | à faire | `CalendarView` : `isCurrentMonth` ne décide que le clic, jamais l'apparence |
| T-004 | Corriger les 4 problèmes du rickroll | code | - | à faire | `docs/redesign-handover.md` §3 ; dont les guesses persistés contrairement au commentaire et la victoire définitive possible |
| T-005 | Rickroll : seed propre au lieu de lire les fixtures à l'exécution | code | - | à faire | `fs.readFileSync(process.cwd() + ...)` casse en build standalone |
| T-006 | Matching des guesses : normalisation puis alias LLM à l'ingestion | code + décision | décision Malik (partie LLM) | attente-décision | Couche 1 (apostrophes, accents, casse) sans LLM d'abord ; couche 2 = alias stockés par chanson, matching runtime déterministe ; ADR requis |
| T-007 | Écran admin (screen 7 de la spec) | code | - | à faire | Optionnel ; entièrement spécé mais hors périmètre du handover |
| T-008 | Fusionner `redesign-2026` dans `main` et pousser | git | décision Malik + revue T-002..T-005 | attente-décision | Les commits locaux ne sont pas poussés |
| T-009 | Garde de date future : comparer en locale, comme le reste de l'app | code | - | à faire | `route.ts:86` calcule « aujourd'hui » en UTC ; le soir venu, « demain » passe pour « aujourd'hui » et reçoit 404 (« no song scheduled ») au lieu de 403 (« hasn't happened yet »). Un joueur peut donc voir le mauvais motif, et une date future sans jeu passe par le mauvais chemin |
| T-010 | E2e : rendre la suite fiable sous charge | code | - | à faire | Avec les 4 workers par défaut, `next dev` répond en 3-11 s par route et 2-3 specs d'archive tombent en timeout. Options : `workers: 1` par défaut, `next build && next start` au lieu de `next dev` pour la suite, ou des timeouts d'attente plus longs |

## Comment les coder

`.clinerules/workflows/next-task.md` prend la première tâche `à faire` dont les dépendances sont `fait`, la fait implémenter (skill `web-dev`), relire (skill `reviewer`) et tester (skill `qa`), puis met à jour son statut. Les tâches `attente-décision` ne sont prises par personne : elles attendent la réponse de Malik, posée en tête du rapport de session.
