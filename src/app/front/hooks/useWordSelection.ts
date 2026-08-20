import { useEffect, useState } from 'react';

export type SelectedGuess = { id: string; word: string } | null;

export interface WordSelection {
  selectedGuess: SelectedGuess;
  highlightedWord: string | null;
  scrollToWord: string | null;
  /**
   * Bumped alongside scrollToWord so selecting the same word twice still
   * scrolls - the word alone is an unchanged dependency the second time.
   */
  scrollTick: number;
  /** The locked selection if there is one, otherwise whatever is hovered. */
  activeWord: string | null;
  hover: (word: string | null) => void;
  /** Lock onto a guess (or clear with null) and scroll its first hit into view. */
  select: (guess: SelectedGuess) => void;
  /** Lock onto a guess without clearing the hover - used after a submission. */
  reveal: (guess: { id: string; word: string }) => void;
}

/**
 * The highlight/scroll cluster shared by the guess list and the lyrics body.
 *
 * These four pieces of state only ever move together, and every caller that
 * touches one touches the rest in the same order, so they travel as a unit.
 */
export function useWordSelection(): WordSelection {
  const [selectedGuess, setSelectedGuess] = useState<SelectedGuess>(null);
  const [highlightedWord, setHighlightedWord] = useState<string | null>(null);
  const [scrollToWord, setScrollToWord] = useState<string | null>(null);
  const [scrollTick, setScrollTick] = useState(0);

  // Esc releases the locked highlight, from anywhere on the page.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedGuess(null);
        setHighlightedWord(null);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const select = (guess: SelectedGuess) => {
    setSelectedGuess(guess);
    setScrollToWord(guess?.word ?? null);
    if (guess) setScrollTick(t => t + 1);
    if (!guess) setHighlightedWord(null);
  };

  const reveal = (guess: { id: string; word: string }) => {
    setSelectedGuess(guess);
    setScrollToWord(guess.word);
    setScrollTick(t => t + 1);
    setHighlightedWord(guess.word);
  };

  return {
    selectedGuess,
    highlightedWord,
    scrollToWord,
    scrollTick,
    activeWord: selectedGuess?.word ?? highlightedWord,
    hover: setHighlightedWord,
    select,
    reveal,
  };
}
