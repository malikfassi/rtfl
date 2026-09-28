**Mode Cline attendu : Plan** (une décision se prend avant de s'écrire).

Décision : `{{args}}`

1. Trouve le prochain numéro libre dans `docs/adr/` (`ls docs/adr`).
2. Crée `docs/adr/NNNN-titre-court.md` en suivant `docs/adr/0000-template.md`, statut `accepté`, date du jour. Utilise le contexte de la conversation ; 25 lignes maximum.
3. Si la décision remplace un ADR, passe l'ancien en `remplacé par NNNN`.
4. Réponds avec le chemin du fichier, rien d'autre.

Rappels propres à rtfl :
- On n'ouvre pas un ADR à la place de Malik : la décision est d'abord validée par lui, l'ADR l'enregistre.
- Sont déjà enregistrés : le jeu sombre à tokens `rtfl-*`, les underscores comme masque, la victoire par titre + artiste, le port Playwright dédié, les fixtures lues à l'exécution par le rickroll.
