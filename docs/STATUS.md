# État du projet

_Mis à jour le 2026-09-28 (reprise : polish validé, e2e réparés, workflow Cline installé)._

## Où on en est

- **Redesign 2026 terminé**, branche `redesign-2026`, non fusionnée dans `main`, non poussée. Détail complet de l'écran de jeu, des fixtures et du rickroll : `docs/redesign-handover.md` (à lire avant toute modif de l'écran de jeu).
- Le polish de fin de session (rail, WinSummary, ShareButton, safe-area) est vérifié : `pnpm type-check` OK, ESLint propre.
- **Suite e2e : 51/51 verts** (en série). Trois bugs de test trouvés et corrigés en la relançant : le seed prenait un 401 (auth admin ajoutée après le handover), le seed calculait ses dates en UTC alors que toute l'app est en local (il plaçait un jeu « demain »), et les specs affirmaient encore la redirection `/rickroll` et la date en texte, deux comportements que le redesign a remplacés.
- Le workflow multi-rôles est installé : `.clinerules/` (2 règles, workflows, skills), plan de tâches `docs/plan/tasks.md`, inbox retours `docs/feedback/backlog.md`, ADR dans `docs/adr/`.

## Prochaine étape

- Trier `docs/feedback/backlog.md` (workflow `.clinerules/workflows/feedback.md`), puis `T-002` (polices du PNG de partage) via `.clinerules/workflows/next-task.md`.

## Décisions en attente de Malik

1. **Strophes** (`docs/redesign-handover.md` §5) : laisser tel quel / cesser de stripper les lignes vides dans `lyrics.ts` (re-scrapage nécessaire) / stanzas côté client. T-001.
2. **Fusion `redesign-2026` -> `main` + push** (T-008).
3. **Alias LLM à l'ingestion des musiques** (T-006) : approuver le principe et le choix du modèle.

## Pièges connus

- **Jest écrase la base de dev** : uniquement avec `DATABASE_URL="file:/tmp/jest-scratch.db"` jetable (voir `.clinerules/skills/qa/SKILL.md`).
- **E2e : `PLAYWRIGHT_PORT=3100`**, jamais un dev server sur :3000.
- **Lancer la suite avec `--workers=1`.** Avec les 4 workers par défaut, le serveur `next dev` répond en 3-11 s par route et 2-3 specs d'archive tombent sur leur timeout (contention, pas un bug). En série : 51/51.
- **`.env*` est gitignoré** : une machine neuve doit recréer `.env.test` avec `ADMIN_PASSWORD`, sinon le seed e2e prend un 401.
- **Toutes les dates du projet sont locales**, jamais `toISOString()`. Le seed s'en écartait et plaçait un jeu « demain » le soir venu ; c'est corrigé, mais toute nouvelle date doit suivre `getCurrentDate()`.
- **Le guard de date future de l'API compare en UTC**, donc « demain » peut répondre 404 (« no song scheduled ») au lieu de 403 (« hasn't happened yet ») selon l'heure. Un test de repli doit accepter les deux.
- Le rickroll lit des fixtures à l'exécution (`fs.readFileSync`) : cassé en build standalone (T-005).
- Mots masqués = underscores, pas des barres : décision client, ne pas « corriger » (ADR-0002).
- Édits de fichiers par remplacement ancré uniquement, jamais `sed -i` / `perl -pi`.
- **Jamais de commande qui ouvre un pager ou un serveur** : `git --no-pager`, et Playwright en reporter `line` (le reporter `html` sert un rapport et attend Ctrl+C, ce qui laisse le run ouvert en arrière-plan).
