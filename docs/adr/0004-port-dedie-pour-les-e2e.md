# ADR 0004 — Un port dédié pour la suite e2e

- **Statut** : accepté
- **Date** : 2026-09-28 (décidé pendant le redesign 2026 de 2026-08)

## Contexte

`playwright.config.ts` réutilisait un serveur déjà présent sur le port 3000 (`reuseExistingServer: true`). Le global-setup de la suite **vide et réamorce une base** : quand un serveur de développement quelconque tenait le port 3000, la suite adoptait ce serveur et lui faisait dérouler le wipe à travers, en pointant sur la base de développement au lieu de la base de test.

## Décision

La suite e2e tourne sur un port dédié, `PLAYWRIGHT_PORT` (défaut 3000, usage : `PLAYWRIGHT_PORT=3100 npx playwright test`). `use.baseURL`, `webServer.url` et le `PORT` du serveur sont tous dérivés de cette variable, et `PLAYWRIGHT_BASE_URL` est fixé dans la config pour que le global-setup ne puisse pas amorcer un serveur et les tests en piloter un autre.

## Conséquences

- Un serveur de développement sur 3000 ne perturbe plus la suite, et sa base de développement n'est jamais touchée.
- La règle à retenir : **jamais `pnpm test:e2e` nu si un `pnpm dev` tourne** ; passer un port explicite.
- La base de test reste `prisma/test.db`, distincte de `prisma/dev.db`.
