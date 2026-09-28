# État du projet

_Mis à jour le 2026-09-28 (reprise : polish validé, e2e réparés, workflow Cline installé)._

## Où on en est

- **Redesign 2026 terminé**, branche `redesign-2026`, non fusionnée dans `main`, non poussée. Détail complet de l'écran de jeu, des fixtures et du rickroll : `docs/redesign-handover.md` (à lire avant toute modif de l'écran de jeu).
- Le polish de fin de session (rail, WinSummary, ShareButton, safe-area) est vérifié : `pnpm type-check` OK, ESLint propre.
- **Deux bugs de test corrigés** après le handover, découverts en relançant la suite :
  1. Le seed e2e prenait un 401 : le commit « Keep the admin session alive » a ajouté l'auth Basic/cookie sur `/api/admin/*` et le seed n'envoyait rien. Corrigé par `ADMIN_PASSWORD` dans `.env.test` + header Basic dans `tests/playwright-seed.ts`.
  2. Les specs attendaient encore une redirection vers `/rickroll` et le texte ISO de la date : le redesign a supprimé la redirection (repli + bandeau nommant la raison) et remplacé le texte par « day NNNN ». Tests mis à jour.
- Suite e2e : `PLAYWRIGHT_PORT=3100 npx playwright test` (jamais sur :3000).
- Le workflow multi-rôles est installé : `.clinerules/` (2 règles, workflows, skills), plan de tâches `docs/plan/tasks.md`, inbox retours `docs/feedback/backlog.md`, ADR dans `docs/adr/`.

## Prochaine étape

- Trier `docs/feedback/backlog.md` (workflow `.clinerules/workflows/feedback.md`), puis `T-002` (polices du PNG de partage) via `.clinerules/workflows/next-task.md`.

## Décisions en attente de Malik

1. **Strophes** (`docs/redesign-handover.md` §5) : laisser tel quel / cesser de stripper les lignes vides dans `lyrics.ts` (re-scrapage nécessaire) / stanzas côté client. T-001.
2. **Fusion `redesign-2026` -> `main` + push** (T-008).
3. **Alias LLM à l'ingestion des musiques** (T-006) : approuver le principe et le choix du modèle.

## Pièges connus

- Jest écrase la base de dev : uniquement avec `DATABASE_URL="file:/tmp/jest-scratch.db"` jetable (voir `.clinerules/skills/qa/SKILL.md`).
- E2e : jamais contre un dev server :3000 ; toujours `PLAYWRIGHT_PORT=3100`.
- `.env*` est gitignoré : une machine neuve doit recréer `.env.test` avec `ADMIN_PASSWORD`, sinon le seed e2e prend un 401.
- Le rickroll lit des fixtures à l'exécution (`fs.readFileSync`) : cassé en build standalone (T-005).
- Mots masqués = underscores, pas des barres : décision client, ne pas « corriger » (ADR-0002).
- Édits de fichiers par remplacement ancré uniquement, jamais `sed -i` / `perl -pi`.
