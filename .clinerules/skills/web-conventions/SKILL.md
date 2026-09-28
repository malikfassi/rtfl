---
name: web-conventions
description: Conventions de code RTFL - structure des dossiers, interface, API, données, tests, nommage. À suivre pour écrire ou relire du code dans src/.
paths: "src/**, tests/**, prisma/**"
---

# Conventions RTFL

## Structure

- `src/app/front/` : l'interface. `components/game/` pour l'écran de jeu (le jeu vit dans `lyrics-game/`), `hooks/` pour l'accès aux données (React Query), `lib/utils/` pour les calculs purs (comptage des touches, progression, couleurs, dates).
- `src/app/api/` : les routes (`games/[date]`, `games/[date]/guess`, admin) et, sous `lib/`, les services métier, les clients externes et les fixtures de test.
- `prisma/` : schéma, migrations, seed. `tests/` : e2e Playwright. Les tests unitaires sont à côté du code (`*.test.ts`).

## Interface

- Rendu sombre uniquement, une classe statique `dark` sur `<html>` (ADR-0001).
- Les couleurs viennent de tokens `rtfl-*` dans `globals.css`, exposés dans `tailwind.config.ts`. Aucun hex dans un composant, sauf les six teintes d'identité de mot de `color-management.ts`.
- Un layout desktop et un layout mobile sont **tous les deux montés**, l'un masqué par une classe `lg:`. Conséquence : un même `data-testid` peut exister deux fois, et les specs doivent utiliser `[data-testid="..."]:visible`.
- Un langage de masquage par mot : un span par token, padding constant, jamais de décalage à la révélation (ADR-0002).
- Les textes affichés sont en anglais. Pas de chaîne d'interface construite dans un utilitaire de calcul.

## API et données

- Une route valide son entrée avec les schémas de `lib/validation.ts` ; les erreurs sortent avec le code que le client sait traduire (400/403/404 deviennent le repli rickroll, 5xx deviennent l'écran d'échec).
- Les services portent la logique ; une route ne fait que valider, appeler, répondre.
- L'état d'un joueur est filtré **côté serveur** par `playerId` : le client ne reçoit jamais les essais d'un autre joueur.
- Les appels externes (Spotify, Genius) passent par les clients de `lib/clients/`, jamais par un `fetch` direct dans un composant ou une route.
- Une date sentinelle (`2099-12-31`) et le rickroll sont un cas particulier traité **avant** la validation de date, sinon le garde-fou de date future le rejette.

## Tests

- Playwright pour le parcours réel (seed par l'API admin, base de test dédiée, port dédié - ADR-0004).
- Jest pour les calculs purs. Base jetable obligatoire (voir skill `qa`).
- Un test qui vérifie un comportement volontairement changé se met à jour en expliquant **pourquoi** dans un commentaire, pas en supprimant l'assertion.
- Éviter les assertions fragiles par construction : `count()` comparé à la main, appel `getByRole('heading', { name: '🎵' })` sur un élément qui n'est plus un titre, date future codée en dur, libellé exact d'un loader.

## Général

- TypeScript strict. Pas de `any` implicite, pas de `@ts-ignore` sans commentaire qui le justifie.
- Nommage en anglais, commentaires en anglais ; la conversation avec Malik est en français.
- Pas de code mort, pas de `TODO` sans ID de tâche.
- Trois lignes similaires valent mieux qu'une abstraction prématurée.
