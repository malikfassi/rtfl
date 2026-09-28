**Mode Cline attendu : Plan pour le tri, Act pour appliquer** (les petits retours s'appliquent tout de suite, les gros deviennent des tâches).

Traite `docs/feedback/backlog.md` :

1. Reprends chaque entrée encore `à traiter`. Si Malik a donné du feedback en chat, **reporte-le d'abord** dans le fichier avant de le traiter, avec la date.
2. Classe chaque entrée dans une seule catégorie :
   - **Correction** (bug visuel, texte, comportement cassé) : applique-la directement en Act si elle est petite et sans décision à prendre, avec `web-dev`. Marque l'entrée `traité` et note le commit.
   - **Tâche** (retour substantiel : un nouvel écran, un changement de parcours, une règle) : crée une entrée dans `docs/plan/tasks.md` (prochain ID libre, type, dépendances, statut `à faire`), et marque le retour `traité` en renvoyant vers l'ID.
   - **Décision** (le retour suppose un choix que seul Malik peut faire) : pose la question, mets le retour `attente-décision`, et n'invente rien.
   - **Refus** : si le retour contredit une décision déjà prise (un ADR, une déviation assumée du handover), marque `refusé` en citant l'ADR ou la section, sans « corriger » ce qui l'a été exprès.
3. Si plusieurs entrées se recoupent, traite-les ensemble et renvoie vers un seul ID de tâche.

À la fin : résume en 5 lignes ce qui a été corrigé tout de suite, ce qui est devenu une tâche, ce qui attend une décision. Ne supprime jamais une entrée.

Rappel : le handover liste des déviations **volontaires** du design (underscores au lieu de barres, input réel au lieu du bloc gris, admin non construit). Un retour qui demande de revenir dessus est une décision, pas une correction.
