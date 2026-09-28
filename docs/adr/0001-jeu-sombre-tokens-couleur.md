# ADR 0001 — Jeu sombre uniquement, couleurs en tokens CSS

- **Statut** : accepté
- **Date** : 2026-09-28 (décidé pendant le redesign 2026 de 2026-08)

## Contexte

Le redesign 2026 remplace la palette claire héritée et introduit Space Grotesk + JetBrains Mono. Les composants récents consommaient des couleurs codées en dur, ce qui rendait tout ajustement global impossible et laissait deux sources de vérité se contredire.

## Décision

Le jeu est **sombre uniquement** : `dark` est une classe statique sur `<html>`, il n'y a pas de bascule de thème. Les couleurs vivent comme propriétés CSS personnalisées dans `src/app/front/globals.css`, sous l'espace de noms `rtfl-*`, et sont exposées à Tailwind dans `tailwind.config.ts`. Aucun composant n'écrit de couleur en dur.

Seule exception assumée : les six teintes d'identité de mot de `src/app/front/lib/utils/color-management.ts`, consommées comme valeurs brutes par les puces, les barres, les surlignages de paroles et la carte de partage.

## Conséquences

- Un changement de palette est une édition de `globals.css`, pas une chasse au hex.
- L'ancien jeu de tokens HSL reste en place pour l'admin et les primitives `ui/*`, hors périmètre du redesign : ne pas le propager aux écrans du jeu.
- Un composant qui a besoin d'une couleur qui n'existe pas en token en fait ajouter un, plutôt que d'inventer un hex.
