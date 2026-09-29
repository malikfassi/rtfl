# ADR-0007 — Claude Haiku 4.5 pour les alias de titres

Date : 2026-09-28
Statut : accepté

## Contexte

Un joueur qui tape `cause` alors que le titre dit `'cause` est refusé, et le refus
est injuste : il a reconnu la chanson. Même chose pour `gonna` / `going to`. Le
matching est aujourd'hui une comparaison de chaînes exactes après `toLowerCase().trim()`
(`GuessService.submitGuess` et `MaskedLyricsService.hasWord`), qui ne connaît ni les
contractions, ni les apostrophes typographiques, ni les variantes phonétiques.

Faire deviner au joueur la ponctuation exacte du titre n'est pas le jeu. L'objectif est
de reconnaître la chanson, pas de reproduire son orthographe.

## Décision

Deux couches, dans cet ordre :

1. **Normalisation déterministe, en code pur, avant toute comparaison** : Unicode NFKC
   (qui ramène `’` à `'`), suppression des accents, de la casse et de la ponctuation
   périphérique. Gratuit, instantané, sans dépendance externe. Règle déjà la majorité
   des cas, y compris les apostrophes typographiques copiées depuis Genius.

2. **Alias générés une fois par chanson par un LLM, au moment de l'ingestion** -
   jamais au moment du guess. Le modèle reçoit le titre, l'artiste et les paroles et
   rend une carte d'équivalences (`'cause` → `because`, `gonna` → `going to`). Elle est
   stockée en base avec la chanson, et le matching à l'exécution reste déterministe
   contre cette table. Aucun appel réseau ne dépend d'un clic de joueur : le jeu reste
   aussi rapide et aussi disponible qu'aujourd'hui, même si l'API LLM tombe.

**Modèle : Claude Haiku 4.5 (`claude-haiku-4-5`), $1 / $5 par million de tokens.**

Le critère était « le moins cher qui reste fort en langue ». La tâche est un jugement
LINGUISTIQUE (repérer contractions, élisions, variantes phonétiques dans des paroles),
pas du raisonnement : c'est le point fort des modèles Claude, et Haiku 4.5 est la seule
offre de la gamme à $1/$5 qui le porte. Descendre plus bas (modèles « nano »)
économiserait des centimes et dégraderait exactement ce qu'on essaie de réparer : un
alias raté fait refuser un guess juste, c'est-à-dire le bug d'origine.

Coût : ~100 chansons × ~1,5K tokens d'entrée = **~$0,40 pour tout le catalogue**, et
~$0,004 par nouvelle chanson. Le prix n'est pas un critère de décision à cette échelle.

## Conséquences

- Nouvelle dépendance `@anthropic-ai/sdk` et `ANTHROPIC_API_KEY`. Le repo n'a aujourd'hui
  aucun SDK LLM ; les autres clients externes (Spotify, Genius) vivent dans
  `lib/clients/`, le client d'alias y vivra aussi.
- Les fixtures de test ne doivent PAS appeler le LLM (ADR-0005) : elles portent des alias
  figés, comme le reste.
- Le champ de stockage des alias demande une migration Prisma.
- Un modèle défaillant doit être non bloquant : si la génération d'alias échoue, la
  chanson s'ingère sans eux. La couche 1 seule reste un jeu jouable.
- Les alias sont des données révélées au joueur : écrire de la mauvaise donnée peut
  faire réussir un guess FAUX, ce qui est plus grave qu'un refus injuste. La formulation
  du prompt doit viser la précision (« uniquement les variantes que le joueur a
  réellement pu taper pour dire CE mot »), pas le rappel.