import type { GameState, RevealThresholds } from './state';
import type { SpotifyContent, Progress } from '@/types/api';

export interface TestCase {
  name: string;
  input: {
    lyrics?: string;
    title: string;
    artist: string;
    guesses: string[];
    thresholds?: RevealThresholds;
  };
  expected: {
    progress: Progress;
    revealedWords: string[];
    shouldRevealSpotify: boolean;
    shouldRevealGenius: boolean;
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
    thresholds?: RevealThresholds;
  };
  expected: {
    isCorrect: boolean;
    progress: Progress;
    shouldRevealSpotify: boolean;
    shouldRevealGenius: boolean;
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
      shouldRevealSpotify: false,
      shouldRevealGenius: false,
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
      shouldRevealSpotify: false,
      shouldRevealGenius: false,
      maskedTitle: 'Hello _____',
      maskedArtist: 'Test ______',
    },
  },
  {
    name: 'Should reveal Spotify at 50% progress',
    input: {
      title: 'Hello',
      artist: 'Test',
      guesses: ['hello'],
      thresholds: { spotify: 0.5, genius: 0.75 },
    },
    expected: {
      progress: {
        titleArtist: 0.5,
        lyrics: 0,
        overall: 0.5,
      },
      revealedWords: ['hello'],
      shouldRevealSpotify: true,
      shouldRevealGenius: false,
      maskedTitle: 'Hello',
      maskedArtist: '____',
    },
  },
  {
    name: 'Should reveal Genius at 75% progress',
    input: {
      lyrics: 'Hello world test case',
      title: 'Hello Test',
      artist: 'World Case',
      guesses: ['hello', 'world', 'test', 'case'],
      thresholds: { spotify: 0.5, genius: 0.75 },
    },
    expected: {
      progress: {
        titleArtist: 1,
        lyrics: 1,
        overall: 1,
      },
      revealedWords: ['hello', 'world', 'test', 'case'],
      shouldRevealSpotify: true,
      shouldRevealGenius: true,
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
      shouldRevealSpotify: false,
      shouldRevealGenius: false,
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
  const isComplete = titleArtistProgress === 1 || lyricsProgress >= 0.8;

  return {
    maskedTitle,
    maskedArtist,
    maskedLyrics,
    progress: {
      titleArtist: titleArtistProgress,
      lyrics: lyricsProgress,
      overall: overallProgress,
    },
    spotify: overallProgress >= 0.5 ? mockSpotifyContent : null,
    genius: overallProgress >= 0.75 ? { lyrics: lyrics ?? '' } : null,
    isComplete,
  };
}
