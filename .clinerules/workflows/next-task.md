**Mode Cline attendu : Act** (avec des passages en Plan pour la relecture, voir étape 3).

Tâche demandée : `{{args}}` (si vide : la première tâche `à faire` de `docs/plan/tasks.md` dont les dépendances sont `fait`).

0. **Resynchronisation** (Act) : `git fetch origin main 2>/dev/null || true` puis `git merge --ff-only main` (ou `origin/main` si le remote existe) sur la branche courante, pour repartir de l'état le plus à jour de `docs/plan/tasks.md`. En cas de conflit ou d'avance impossible en fast-forward, le signaler et demander à Malik plutôt que de forcer.
1. **Choix de la tâche** (Act) : relis `docs/plan/tasks.md` après resynchronisation. Choisis la première tâche `à faire` dont les dépendances sont `fait`. Une tâche `attente-décision` ne se prend pas : si `{{args}}` la désigne, ou si c'est la seule qui reste, arrête-toi et repose la question. Passe la tâche choisie à `en cours`, commit ce changement de statut seul.
2. **Implémentation** (Act) : charge `.clinerules/skills/web-dev/SKILL.md` et implémente la tâche.
3. **Relecture** (Plan) : charge `.clinerules/skills/reviewer/SKILL.md`. Si des constats graves : reviens à l'étape 2 pour corriger, puis relis une fois. Deux allers-retours au maximum, sinon demande à Malik.
4. **Vérifications** (Act) : charge `.clinerules/skills/qa/SKILL.md` (type-check, ESLint, e2e si l'interface est touchée).
5. Si tout passe : statut `fait`, commit. Sinon : `bloqué` avec la raison en une ligne, commit, et **ne pas fusionner**.
6. **Fin de tâche** : ne fusionne jamais automatiquement dans `main`. La branche et le commit sont prêts ; c'est Malik qui décide de l'intégration (T-008 le fera pour l'ensemble du redesign).
7. **Rapport à Malik en 5 lignes** : ce qui marche, ce qui reste, la prochaine tâche, la branche/les commits créés, et si la tâche est prête à être fusionnée. Si une décision l'attend, la poser en premier.

Règles qui ont coûté du temps et qu'il ne faut pas réapprendre :
- Un test e2e qui échoue n'est pas forcément un bug : le redesign a retiré la redirection `/rickroll` (repli + bandeau à la place) et le texte ISO de la date (« day 1002 »). Vérifie le code avant de « réparer » le produit.
- Ne touche pas aux déviations volontaires listées dans `docs/STATUS.md` et les ADR.
- Ne lance pas Jest sans `DATABASE_URL` jetable.
