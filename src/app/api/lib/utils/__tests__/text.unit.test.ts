import { describe, it, expect } from '@jest/globals';
import { normalizeWord, wordsMatch, tokenizeWords } from '../text';

/**
 * La couche 1 de l'ADR-0007 : reconnaître un mot malgré la typographie.
 *
 * Ces cas ne sont pas inventés pour les tests. Chacun vient d'une façon dont un
 * joueur tape réellement, ou de ce que Genius met réellement dans ses paroles.
 */
describe('normalizeWord', () => {
  describe('accents', () => {
    it('should strip diacritics', () => {
      expect(normalizeWord('était')).toBe('etait');
      expect(normalizeWord('cœur')).toBe('cœur'); // la ligature œ n'est pas un accent
      expect(normalizeWord('maître')).toBe('maitre');
      expect(normalizeWord('ça')).toBe('ca');
      expect(normalizeWord('José')).toBe('jose');
    });

    it('should leave an unaccented word alone', () => {
      expect(normalizeWord('party')).toBe('party');
    });

    it('should strip combining marks that arrive pre-decomposed', () => {
      // Certains claviers et certains flux de copier-coller envoient `e` + U+0301
      // plutôt que `é`. Les deux doivent donner le même résultat.
      const decomposed = 'e\u0301te\u0301';
      expect(normalizeWord(decomposed)).toBe('ete');
    });
  });

  describe('apostrophes and quotes', () => {
    it('should fold the typographic apostrophe onto the typewriter one', () => {
      // Genius rend `’` (U+2019) ; un clavier produit `'` (U+0027).
      expect(normalizeWord('don\u2019t')).toBe(normalizeWord("don't"));
    });

    it('should fold curly quotes onto straight ones', () => {
      expect(normalizeWord('\u201Cyes\u201D')).toBe(normalizeWord('"yes"'));
    });

    it('should fold the prime used for feet and minutes', () => {
      expect(normalizeWord('5\u2032')).toBe(normalizeWord("5'"));
    });
  });

  describe('case and whitespace', () => {
    it('should lowercase', () => {
      expect(normalizeWord('PARTY')).toBe('party');
      expect(normalizeWord('PaRtY')).toBe('party');
    });

    it('should trim surrounding whitespace', () => {
      expect(normalizeWord('  party  ')).toBe('party');
      expect(normalizeWord('\tparty\n')).toBe('party');
    });

    it('should keep inner whitespace', () => {
      // Un mot est un mot ; c'est le découpage, pas la normalisation, qui
      // s'occupe des textes à plusieurs mots.
      expect(normalizeWord('going to')).toBe('going to');
    });
  });

  describe('width and ligatures', () => {
    it('should fold full-width characters', () => {
      expect(normalizeWord('ＡＢＣ')).toBe('abc');
      expect(normalizeWord('１２３')).toBe('123');
    });

    it('should fold the fi and fl ligatures', () => {
      expect(normalizeWord('\uFB01re')).toBe('fire');
      expect(normalizeWord('\uFB02ow')).toBe('flow');
    });
  });

  describe('idempotence', () => {
    it('should be stable when applied twice', () => {
      // Le service normalise des deux côtés d'une comparaison, et un mot peut donc
      // traverser la fonction deux fois. Ce doit être sans effet.
      for (const word of ['Était', 'DON\u2019T', '  ＡＢＣ  ']) {
        const once = normalizeWord(word);
        expect(normalizeWord(once)).toBe(once);
      }
    });
  });

  it('should not turn one word into another', () => {
    // Le risque le plus grave de cette couche : un mot accepté pour un autre.
    expect(normalizeWord('fois')).not.toBe(normalizeWord('foi'));
    expect(normalizeWord('beat')).not.toBe(normalizeWord('beats'));
    expect(normalizeWord('ill')).not.toBe(normalizeWord("i'll"));
  });
});

describe('wordsMatch', () => {
  it('should match across every axis at once', () => {
    expect(wordsMatch('Était ', 'etait')).toBe(true);
    expect(wordsMatch("DON'T", 'don\u2019t')).toBe(true);
    expect(wordsMatch('  Party  ', 'PARTY')).toBe(true);
  });

  it('should not match different words', () => {
    expect(wordsMatch('party', 'parties')).toBe(false);
    expect(wordsMatch('hello', 'goodbye')).toBe(false);
  });
});

describe('tokenizeWords', () => {
  it('should split on whitespace and punctuation', () => {
    expect(tokenizeWords('I hopped off the plane')).toEqual([
      'i',
      'hopped',
      'off',
      'the',
      'plane'
    ]);
  });

  it('should treat an apostrophe as a separator, like the display does', () => {
    // `don’t` s'affiche avec `don` et `t` masqués séparément : deux mots. Si le
    // découpage différait de celui de MaskedLyricsService, un mot présent dans les
    // paroles pourrait ne jamais être trouvé.
    expect(tokenizeWords("don't")).toEqual(['don', 't']);
    expect(tokenizeWords('don\u2019t')).toEqual(['don', 't']);
  });

  it('should keep numbers as words', () => {
    expect(tokenizeWords('me 2 you')).toEqual(['me', '2', 'you']);
  });

  it('should keep the original order and duplicates', () => {
    expect(tokenizeWords('la la land')).toEqual(['la', 'la', 'land']);
  });

  it('should normalize every token', () => {
    expect(tokenizeWords('Il Était don\u2019t')).toEqual(['il', 'etait', 'don', 't']);
  });

  it('should return nothing for punctuation only', () => {
    expect(tokenizeWords('--- ... !!!')).toEqual([]);
    expect(tokenizeWords('')).toEqual([]);
  });

  it('should handle the multi-line text the lyrics come in as', () => {
    expect(tokenizeWords('first line\nsecond line')).toEqual([
      'first',
      'line',
      'second',
      'line'
    ]);
  });
});
