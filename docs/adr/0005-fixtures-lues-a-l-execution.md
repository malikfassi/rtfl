# ADR 0005 — Les fixtures sont lues à l'exécution pour le rickroll

- **Statut** : accepté
- **Date** : 2026-09-28 (constaté, pas décidé : dette documentée à fermer)

## Contexte

Toutes les dépendances externes (Spotify, Genius) sont enregistrées sur disque sous `src/app/api/lib/test/fixtures/` pour que les tests et le développement local ne frappent jamais une API réelle. Le rickroll (*Never Gonna Give You Up*, servi à la date sentinelle `2099-12-31`) est un jeu réel auto-amorcé : `createRickrollGame` lit **trois de ces fichiers à l'exécution** via `fs.readFileSync(process.cwd() + 'src/app/api/lib/test/fixtures/...')`.

## Décision

C'est l'état actuel, assumé provisoirement : le rickroll se répare seul si la base est vidée, y compris en local. Rien n'est fait tant que T-005 n'est pas prise.

## Conséquences

- **En build standalone ou serverless, ces chemins ne sont pas tracés** : l'easter egg répondrait 500. C'est la raison de la tâche T-005, qui remplacera la lecture de fichiers par un amorçage propre en base.
- Tant que T-005 n'est pas faite, ne pas déployer un build standalone en comptant sur le rickroll.
- Le rickroll est un jeu réel : il persiste des essais et peut être gagné définitivement, contrairement à ce qu'affirme le commentaire de `guess/route.ts`. Ce point est traité dans T-004.
