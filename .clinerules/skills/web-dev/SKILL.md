---
name: web-dev
description: Implémente une tâche du plan dans la stack Next.js/React/Prisma de RTFL. À charger pour écrire du code produit.
mode: Act
effort: medium (high si la tâche touche le matching des essais, le scraping, la concurrence ou les migrations)
---

# Implémenter une tâche

Tu écris le code d'**une** tâche de `docs/plan/tasks.md`. Lis la tâche, son contexte dans les docs liés, puis implémente. Ne déborde pas sur les tâches voisines.

## Avant d'écrire

- Lis les fichiers que tu vas modifier. Jamais d'édition à l'aveugle.
- Relis `docs/redesign-handover.md` si la tâche touche l'écran de jeu : il décrit des déviations volontaires et des pièges de testids que tu casserais sans le savoir.
- Vérifie les ADR de `docs/adr/` qui portent sur la zone : ils sont contraignants, pas indicatifs.

## Règles de code

- Next.js 15 App Router, React 18, TypeScript, Tailwind. Pas de nouvelle dépendance sans ADR.
- Composants serveur par défaut ; `"use client"` seulement quand l'interactivité l'exige (les composants de jeu le sont).
- Les requêtes serveur passent par les services de `src/app/api/lib/services/`, pas par Prisma directement dans une route.
- Une route API valide son entrée avec les schémas de `src/app/api/lib/validation.ts` et répond avec les codes attendus par le client (le client traduit 400/403/404 en repli rickroll).
- Les couleurs sont des tokens `rtfl-*` (ADR-0001). Les textes affichés sont en anglais.
- Commentaires en anglais, uniquement quand la raison d'être du code n'est pas évidente. Un commentaire qui explique *pourquoi*, pas *quoi*.
- Pas de code mort, pas de `TODO` sans ID de tâche.
- Pas d'abstraction pour un usage unique, pas de fonctionnalité spéculative.

## Éditer un fichier

Jamais par one-liner shell (`sed -i`, `perl -pi`, découpage Python) : Malik lit les diffs, on édite par remplacement ancré, même en plusieurs passes. Le shell reste bon pour lire.

## Terminer

- Mets à jour les tests affectés. Un test qui échoue parce que le comportement a **volontairement** changé se met à jour avec un commentaire qui dit pourquoi ; un test qui échoue à cause d'un bug se corrige dans le produit.
- Lance `pnpm type-check` et ESLint sur ce que tu as touché avant de rendre.
- Ne commite pas toi-même : le workflow `next-task` gère statut et commits.
- Rends un résumé court : fichiers touchés, décisions prises, ce qui reste incertain.
