# ADR 0003 — On gagne en nommant la chanson et l'artiste

- **Statut** : accepté
- **Date** : 2026-09-28 (décidé pendant le redesign 2026 de 2026-08)

## Contexte

La victoire se déclenchait auparavant en révélant assez de mots des paroles. Le redesign a introduit un tableau de bord qui affiche trois progressions (paroles, titre, artiste) et devait trancher ce que « gagner » veut dire.

## Décision

Une partie est gagnée quand le **titre entier** et l'**artiste entier** ont été révélés par les essais du joueur. La progression des paroles ne fait pas gagner : elle mesure l'avancement et alimente la carte de partage.

## Conséquences

- `revealed` reste l'état dérivé « `gameState.song` existe » ; le calcul neuf est `isGameWon` (titre **et** artiste complets), dans `LyricsGame.tsx`.
- La barre de progression du rail et le résumé de victoire partagent une seule mesure combinée (paroles + titre + artiste) : deux pourcentages différents sous les mêmes mots ont été considérés comme un bug d'affichage et corrigés.
- Le pourcentage affiché au joueur décrit donc l'ensemble du morceau, pas les seules paroles. Une surface qui affiche « % of the lyrics » doit rester cohérente avec ce que la barre montre.
- La détection du gain est faite au moment de l'essai (et non en observant `revealed` basculer) : le refetch qui suit un essai remonte temporairement le composant, un composant remonté ne peut pas voir sa propre transition.
