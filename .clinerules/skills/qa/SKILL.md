---
name: qa
description: Vérifie un changement RTFL - types, lint, tests unitaires, e2e - sans casser la base de développement. À charger pour exécuter les vérifications.
mode: Act
effort: low
---

# Vérifier

Tu exécutes des vérifications et tu rapportes ce qui casse. Tu ne décides pas de la correction.

## Ordre, du moins cher au plus cher

1. `pnpm type-check` - types seuls (`tsc --noEmit`).
2. `npx eslint <fichiers touchés>` - ou `pnpm lint` pour tout.
3. Tests unitaires, **uniquement avec une base jetable** :
   ```
   DATABASE_URL="file:/tmp/jest-scratch.db" npx prisma migrate deploy
   DATABASE_URL="file:/tmp/jest-scratch.db" npx jest --runInBand
   ```
   **Ne jamais lancer `pnpm jest` nu** : env.ts lit `.env`, la suite écraserait `prisma/dev.db`. Avant de faire confiance au résultat, vérifier que `prisma/dev.db` est inchangé après coup.
4. e2e Playwright, si l'interface ou une route a bougé :
   ```
   PLAYWRIGHT_PORT=3100 npx playwright test --workers=1
   ```
   Le global-setup vide et réamorce la base e2e : jamais sur un serveur de développement partagé (ADR-0004).
   **`--workers=1`** : avec les 4 workers par défaut, le serveur de dev répond en 3-11 s par route et 2-3 specs d'archive tombent sur leur timeout. La contention ressemble à un échec de test ; en série, la suite est verte.
   Jamais le reporter `html` : il sert un rapport et attend Ctrl+C, ce qui laisse le run ouvert en arrière-plan (la config utilise `line`).

## Lire un échec

- Un test qui échoue peut révéler un test périmé, pas un bug : le redesign a retiré la redirection `/rickroll` (repli + bandeau à la place) et le texte ISO de la date (« day 1002 »). Vérifie le code produit avant de conclure.
- Compare les messages d'échec à la cause réelle : un `toHaveURL` qui n'arrive pas, un `:visible` qui ne matche plus, deux éléments pour un même testid (les layouts desktop et mobile sont montés tous les deux, l'un masqué par une classe `lg:`).
- Si un échec dépend de la date du jour, il est fragile par construction : signale-le.
- Rapporte les échecs avec le test, l'attendu, le reçu, et la ligne fautive dans le code.

## Terminer

- `prisma/test-dbs/` grossit sans limite ; `pnpm clean:db` nettoie, mais ne l'exécute que si Malik est d'accord (il touche aussi des restes de test).
- Rends un verdict court : ce qui passe, ce qui échoue, ce qui n'a pas pu être vérifié.
