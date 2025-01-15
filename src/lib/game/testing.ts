import type { GameState } from './state';
import type { SpotifyContent, Progress } from '@/types/api';

export interface TestCase {
  name: string;
  input: {
    lyrics?: string;
    title: string;
    artist: string;
    guesses: string[];
  };
  expected: {
    progress: Progress;
    revealedWords: string[];
    isComplete: boolean;
    maskedTitle: string;
    maskedArtist: string;
    maskedLyrics?: string;
  };
}

export interface GuessTestCase {
  name: string;
  input: {
    guess: string;
    currentState: GameState;
  };
  expected: {
    isCorrect: boolean;
    progress: Progress;
    isComplete: boolean;
  };
}

export const mockSpotifyContent: SpotifyContent = {
  artistName: 'Test Artist',
  songTitle: 'Test Song',
  albumCover: 'https://example.com/cover.jpg',
  previewUrl: 'https://example.com/preview.mp3',
};

export const testCases: TestCase[] = [
  {
    name: 'Should mask all words initially',
    input: {
      title: 'Hello World',
      artist: 'Test Artist',
      guesses: [],
    },
    expected: {
      progress: {
        titleArtist: 0,
        lyrics: 0,
        overall: 0,
      },
      revealedWords: [],
      isComplete: false,
      maskedTitle: '_____ _____',
      maskedArtist: '____ ______',
    },
  },
  {
    name: 'Should reveal matched words',
    input: {
      title: 'Hello World',
      artist: 'Test Artist',
      guesses: ['hello', 'test'],
    },
    expected: {
      progress: {
        titleArtist: 0.5,
        lyrics: 0,
        overall: 0.5,
      },
      revealedWords: ['hello', 'test'],
      isComplete: false,
      maskedTitle: 'Hello _____',
      maskedArtist: 'Test ______',
    },
  },
  {
    name: 'Should complete when title and artist are revealed',
    input: {
      title: 'Hello',
      artist: 'Test',
      guesses: ['hello', 'test'],
    },
    expected: {
      progress: {
        titleArtist: 1,
        lyrics: 0,
        overall: 1,
      },
      revealedWords: ['hello', 'test'],
      isComplete: true,
      maskedTitle: 'Hello',
      maskedArtist: 'Test',
    },
  },
  {
    name: 'Should complete when 80% of lyrics are found',
    input: {
      lyrics: 'Hello world test case',
      title: 'Hello Test',
      artist: 'World Case',
      guesses: ['hello', 'world', 'test', 'case'],
    },
    expected: {
      progress: {
        titleArtist: 1,
        lyrics: 1,
        overall: 1,
      },
      revealedWords: ['hello', 'world', 'test', 'case'],
      isComplete: true,
      maskedTitle: 'Hello Test',
      maskedArtist: 'World Case',
      maskedLyrics: 'Hello world test case',
    },
  },
];

export const guessTestCases: GuessTestCase[] = [
  {
    name: 'Should handle correct title guess',
    input: {
      guess: 'hello',
      currentState: {
        maskedTitle: {
          original: 'Hello World',
          maskedText: '_____ _____',
          words: [
            { word: 'hello', startIndex: 0, endIndex: 4, isRevealed: false },
            { word: 'world', startIndex: 6, endIndex: 10, isRevealed: false },
          ],
          revealedCount: 0,
        },
        maskedArtist: {
          original: 'Test Artist',
          maskedText: '____ ______',
          words: [
            { word: 'test', startIndex: 0, endIndex: 3, isRevealed: false },
            { word: 'artist', startIndex: 5, endIndex: 10, isRevealed: false },
          ],
          revealedCount: 0,
        },
        maskedLyrics: null,
        progress: {
          titleArtist: 0,
          lyrics: 0,
          overall: 0,
        },
        spotify: null,
        genius: null,
        isComplete: false,
      },
    },
    expected: {
      isCorrect: true,
      progress: {
        titleArtist: 0.25,
        lyrics: 0,
        overall: 0.25,
      },
      isComplete: false,
    },
  },
];

export function createMockGameState(
  title: string,
  artist: string,
  lyrics: string | null = null,
  revealedWords: string[] = [],
): GameState {
  const createMaskedContent = (text: string) => {
    const words = text.split(/\s+/).map((word) => {
      const startIndex = text.indexOf(word);
      return {
        word: word.toLowerCase(),
        startIndex,
        endIndex: startIndex + word.length - 1,
        isRevealed: revealedWords.includes(word.toLowerCase()),
      };
    });

    const maskedText = text.replace(/\w+/g, (word) =>
      revealedWords.includes(word.toLowerCase()) ? word : '_'.repeat(word.length),
    );

    return {
      original: text,
      maskedText,
      words,
      revealedCount: words.filter((w) => w.isRevealed).length,
    };
  };

  const maskedTitle = createMaskedContent(title);
  const maskedArtist = createMaskedContent(artist);
  const maskedLyrics = lyrics ? createMaskedContent(lyrics) : null;

  const titleArtistWords = maskedTitle.words.length + maskedArtist.words.length;
  const titleArtistRevealed = maskedTitle.revealedCount + maskedArtist.revealedCount;
  const titleArtistProgress = titleArtistWords > 0 ? titleArtistRevealed / titleArtistWords : 0;

  const lyricsProgress = maskedLyrics
    ? maskedLyrics.revealedCount / maskedLyrics.words.length
    : 0;

  const overallProgress = Math.max(titleArtistProgress, lyricsProgress);
  const isComplete = (titleArtistProgress === 1) || (lyricsProgress >= 0.8);

  return {
    maskedTitle,
    maskedArtist,
    maskedLyrics,
    progress: {
      titleArtist: titleArtistProgress,
      lyrics: lyricsProgress,
      overall: overallProgress,
    },
    spotify: isComplete ? mockSpotifyContent : null,
    genius: isComplete && lyrics ? { lyrics } : null,
    isComplete,
  };
}
