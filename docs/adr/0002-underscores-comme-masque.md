# ADR 0002 — Les mots masqués sont des underscores

- **Statut** : accepté
- **Date** : 2026-09-28 (décidé pendant le redesign 2026 de 2026-08)

## Contexte

La spécification du redesign demandait des barres inline-block vides à la place des mots non trouvés, pour un rendu plus « bloc ». Le propriétaire du produit a demandé en cours de session de conserver les underscores.

## Décision

Un mot non trouvé s'affiche comme une suite d'underscores, pas comme une barre vide. Le reste de cette section de la spécification est conservé : **un span par token**, et un padding constant pour que la révélation d'un mot ne décale jamais le texte autour.

## Conséquences

- La largeur d'un mot masqué est celle de ses underscores, ce qui donne au texte un rythme propre au monospace et un repère visuel du nombre de lettres.
- **Ne pas « corriger » ce point vers les barres vides** : ce n'est pas un écart par oubli, c'est la décision retenue. Une demande inverse est une nouvelle décision produit.
- Toute retouche du rendu des paroles doit préserver la règle du span par token et du padding constant, qui est la vraie contrainte technique de cette section.
