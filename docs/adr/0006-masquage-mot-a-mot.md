# ADR-0006 — Un mot deviné ne révèle que lui-même

Date : 2026-09-28
Statut : accepté

## Contexte

Le handover avait laissé une question ouverte (« T-001 ») avec trois options : un mot
deviné révèle (A) lui-même seulement, (B) la strophe entière où il apparaît, ou
(C) sa ligne entière. La question restait ouverte faute de décision produit, et
bloquait la validation de la « finale » (ce que le joueur ressent au moment de gagner).

En relisant le code, la question était surtout théorique : l'implémentation actuelle est
(A), et rien n'indiquait qu'elle avait été choisie par accident. Le comportement observé
correspond au comportement voulu.

## Décision

Un mot deviné ne révèle que lui-même. Le masquage reste inchangé : chaque occurrence du
mot exact dans le titre, l'artiste ou les paroles se démature, rien d'autre. C'est le
comportement actuel.

## Conséquences

- Le moteur de jeu ne bouge pas : `hasWord` et `reconstructText` restent tels quels dans
  `MaskedLyricsService`.
- Le rythme reste granulaire : un mot = un succès. Une chanson de 200 mots demande
  beaucoup de succès, la récompense est fréquente et petite plutôt que rare et grande.
  Ce sont les fondations posées par la sensation de fin de partie (voir ADR-0003), qui
  porte alors tout le poids de la récompense - pas d'ajustement à y faire à ce stade.
  En particulier, la « finale » de la fin de partie devient un élément central du
  design, et non plus un détail.
- Si le rythme doit changer plus tard, cette décision est à rouvrir avant de toucher
  à `hasWord` : révéler une strophe est un changement d'un `Set` et d'une session de
  fenêtre, pas de la structure de données, donc la réouverture reste bon marché.