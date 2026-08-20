import type { GameState } from '@/app/types';

export interface LyricsGameProps {
  gameState: GameState | null;
  onGuess: (word: string) => Promise<GameState | void>;
  date: string;
  playerId?: string;
}

export interface GuessInputProps {
  onGuessSubmit: (guess: string) => Promise<number>;
  pendingGuess: string | null;
  disabled: boolean;
  placeholder?: string;
  /** Mobile: show the result at the input's right edge instead of in a row below it. */
  inlineFeedback?: boolean;
  onDuplicateGuess?: (guess: string) => void;
}

export interface ShareButtonProps {
  wordsFound: number;
  guessesUsed: number;
  bestWordHits: number;
  overallPercent: number;
  segments: Array<{ id: string; word: string; hits: number }>;
  total: number;
  date: string;
  dayNumber: number;
  className?: string;
}
