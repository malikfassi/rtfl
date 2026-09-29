/**
 * Normalisation des mots devinés et des mots des paroles.
 *
 * Un joueur qui tape `cause` a reconnu `'cause`, et celui qui tape `etait` a
 * reconnu `était`. Refuser ces essais n'apprend rien : le jeu demande de
 * reconnaître la chanson, pas de reproduire sa ponctuation ni ses accents. Cette
 * couche est déterministe et sans dépendance : elle tourne à chaque essai, sur
 * chaque mot, et doit rester instantanée.
 *
 * C'est la couche 1 de l'ADR-0007. Les variantes qui demandent de comprendre la
 * langue (`gonna` pour `going to`, `cause` pour `because`) ne sont pas ici : elles
 * demandent un jugement, et sont générées une fois par chanson à l'ingestion.
 */

/**
 * Ramène un texte à sa forme comparable : sans accents, sans ponctuation
 * typographique, en minuscules.
 *
 * Trois étapes, et chacune a été ajoutée parce qu'un test ou une donnée réelle
 * montrait qu'elle manquait :
 *
 * - **NFKC** replie les caractères de compatibilité : formes pleine largeur (`Ａ`),
 *   ligatures (`ﬁ`), chiffres exotiques. Il faut savoir ce qu'il ne fait PAS, parce
 *   que c'est contre-intuitif : il ne replie **pas** l'apostrophe typographique
 *   `’` (U+2019) sur `'` (U+0027), ni les guillemets courbes. Ce sont des
 *   caractères distincts, pas des variantes de compatibilité. D'où l'étape 2.
 *
 * - **L'unification des apostrophes et guillemets**, faite à la main : Genius rend
 *   `’` et `“ ”`, un clavier produit `'` et `"`. Sans cette étape, la comparaison
 *   échoue sur deux caractères qui s'affichent presque identiquement - c'est le
 *   bug que l'ADR-0007 existe pour corriger.
 *
 * - **NFD puis suppression des marques** : NFD décompose les lettres accentuées en
 *   lettre + marque (`é` U+00E9 devient `e` + U+0301). NFKC ne le fait pas non
 *   plus. Sans NFD, la suppression ci-dessous ne trouverait rien à supprimer, et
 *   `était` ne serait pas reconnu depuis un clavier qui tape `etait`.
 */

/**
 * Tous les caractères que les éditeurs et les claviers produisent pour dire
 * « apostrophe », et vers quoi ils sont ramenés.
 *
 * La liste est plus longue qu'on ne l'attend : outre `’`, les paroles contiennent
 * souvent `´` (accent aigu, fréquent dans les corrections automatiques) et `′`
 * (prime, utilisé pour les minutes). Les ramener tous au même caractère évite de
 * traiter chaque variante comme un cas particulier au moment de la comparaison.
 */
const APOSTROPHES = /[\u2018\u2019\u201A\u201B\u02BC\u02B9\u02BB\u2032\u00B4`]/g;
const DOUBLE_QUOTES = /[\u201C\u201D\u201E\u201F\u2033\u00AB\u00BB]/g;

export function normalizeWord(raw: string): string {
  return raw
    .normalize('NFKC')
    .replace(APOSTROPHES, "'")
    .replace(DOUBLE_QUOTES, '"')
    .normalize('NFD')
    // Les diacritiques, maintenant détachés par NFD.
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * Deux mots sont-ils le même essai ? C'est la seule question que le matching du
 * jeu pose, et elle doit se poser de la même façon pour un essai et pour un mot
 * des paroles - sinon la normalisation est asymétrique, et deux mots qui sont
 * égaux après normalisation ne se rencontrent jamais.
 */
export function wordsMatch(a: string, b: string): boolean {
  return normalizeWord(a) === normalizeWord(b);
}

/**
 * Découpe un texte en mots comparables, dans l'ordre, doublons compris.
 *
 * Même découpage que `MaskedLyricsService` (`\p{L}+` et `\p{N}+`) : si les deux
 * découpages divergeaient, un mot pourtant présent pourrait ne pas être trouvé.
 * Les nombres sont des mots ; une apostrophe, non - `don't` est deux mots, ce qui
 * est cohérent avec l'affichage (`don` et `t` sont masqués séparément).
 */
export function tokenizeWords(text: string): string[] {
  return (text.match(/[\p{L}\p{N}]+/gu) ?? []).map(normalizeWord);
}
