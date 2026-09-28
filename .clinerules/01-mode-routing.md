# Routage du travail : Plan vs Act

Cline n'a pas d'agents séparés avec un modèle par rôle : un seul modèle actif par mode. Chaque skill de rôle indique son mode et son effort. **Respecte-le** et change de mode quand le skill l'exige.

| Rôle | Skill | Mode | Effort | Pourquoi |
|---|---|---|---|---|
| Orchestration, arbitrages avec Malik | session principale | Plan pour décider / Act pour éditer | medium | Voit tout, décide ; ne fait pas le travail lourd |
| Implémenter une tâche | `web-dev` | Act | medium (high si délicat) | Le gros du volume |
| Relecture | `reviewer` | Plan | high | Trouver les bugs demande de l'attention, pas d'édition |
| Vérifications (types, lint, e2e) | `qa` | Act | low | Exécuter et lire des erreurs |
| ADR simple | workflow `adr` | Plan | low | Remplir un modèle |
| Mise à jour du statut | workflow `handoff` | Act | low | Résumé mécanique |
| Trier les retours | workflow `feedback` | Plan | medium | Classer, pas encore implémenter |

`max` : jamais par défaut. Uniquement pour un problème bloquant après un échec en `high`.

## Pourquoi un mode plutôt qu'un autre

- **Plan** = lire, analyser, décider, proposer. Aucune écriture, aucun commit. On y tient la relecture : un reviewer qui édite perd la distance nécessaire pour voir le bug.
- **Act** = éditer, exécuter, tester, commiter. On y tient l'implémentation et la QA.
- Il est normal d'alterner plusieurs fois dans une même tâche : implémenter (Act), faire relire (Plan), corriger, tester (Act).

## Règle des décisions

Un blocage sur une décision qui revient à Malik n'arrête pas la session : la question se pose, la tâche passe `attente-décision`, et l'agent enchaîne sur une tâche indépendante. C'est seulement quand il ne reste que des tâches bloquées que la session s'arrête en posant les questions.

## Économiser les tokens

1. **Les docs sont la mémoire** : une décision est écrite une fois (ADR, `docs/notes/`, `backlog.md`) et relue, jamais re-déduite.
2. **Une tâche, une session** : `handoff` puis nouvelle conversation. On repart de `docs/STATUS.md`, pas de l'historique.
3. **Ne pas relire le code pour du travail déjà décrit** : les docs et les diffs commités suffisent.
4. **Pas de workflow pour une petite chose** : renommer, corriger une ligne, répondre à une question, l'agent le fait directement en Act.
5. **Parallèle quand c'est indépendant** : deux lectures ou deux vérifications sans lien se lancent ensemble.
