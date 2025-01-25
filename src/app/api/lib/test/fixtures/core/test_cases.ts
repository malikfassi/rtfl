import { expect } from '@jest/globals';
import type { Game, PrismaClient, Song } from '@prisma/client';
import type { JsonValue } from '@prisma/client/runtime/library';
import { type SimplifiedPlaylist, Track } from '@spotify/web-api-ts-sdk';

import type { GeniusSearchResponse } from '@/app/types/genius';
import type { GameState } from '@/app/api/lib/types/game';
import { seedDatabase, TEST_SCENARIOS as SEED_SCENARIOS } from '@/app/api/lib/test/fixtures/core/seed-scenarios';

import geniusJson from '../data/genius.json';
import lyricsJson from '../data/lyrics.json';
import spotifyJson from '../data/spotify.json';
import { PLAYLIST_IDS, SONG_IDS } from '../spotify_ids';
import type { GeniusFixtures, LyricsFixtures, SpotifyFixtures } from './types';
import { validators } from './validators';

// Type assertions with runtime validation
const typedSpotifyJson = spotifyJson as unknown as SpotifyFixtures;
const typedGeniusJson = geniusJson as unknown as GeniusFixtures;
const typedLyricsJson = lyricsJson as unknown as LyricsFixtures;

// Test IDs for consistent usage across tests
export const TEST_IDS = {
  GAME: 'clrqm6nkw0009uy08kg9h1p3x',
  PLAYER: 'clrqm6nkw0010uy08kg9h1p4x',
  PLAYER_2: 'clrqm6nkw0013uy08kg9h1p7x'
} as const;

export type TestSongKey = keyof typeof SONG_IDS;
export type GameWithSong = Game & { song: Song };
export type TestScenarioKey = keyof typeof SEED_SCENARIOS;

// Helper function for masking text
function maskText(text: string): string {
  return text.replace(/\p{L}+|\p{N}+/gu, word => '_'.repeat(word.length));
}

// Update the helper function to match LyricsService implementation
function maskTextWithGuesses(text: string, guessedWords: Set<string>): string {
  // Normalize guessedWords for case-insensitive matching
  const normalizedGuessedWords = new Set(
    Array.from(guessedWords).map(word => word.toLowerCase())
  );

  // Mask all letters and numbers, but preserve guessed words
  return text.replace(/\p{L}+|\p{N}+/gu, (word) => {
    const normalizedWord = word.toLowerCase();
    return normalizedGuessedWords.has(normalizedWord) ? word : '_'.repeat(word.length);
  });
}

// Create test cases from song IDs
export const SONGS = Object.entries(SONG_IDS).reduce<Record<string, SongTestCase>>(
  (acc, [key, id]: [string, typeof SONG_IDS[keyof typeof SONG_IDS]]) => {
    const testCase: SongTestCase = {
      id,
      spotify: {
        getTrack: () => typedSpotifyJson.tracks[id as keyof typeof typedSpotifyJson.tracks],
        getError: typedSpotifyJson.errors?.tracks[id as keyof typeof typedSpotifyJson.errors.tracks] 
          ? () => typedSpotifyJson.errors!.tracks[id as keyof typeof typedSpotifyJson.errors.tracks]
          : undefined
      },
      genius: {
        getSearch: () => typedGeniusJson.byId[id as keyof typeof typedGeniusJson.byId].search,
        getBestMatch: () => {
          const data = typedGeniusJson.byId[id as keyof typeof typedGeniusJson.byId];
          return {
            url: data.url,
            title: data.title,
            artist: data.artist
          };
        }
      },
      lyrics: {
        get: () => typedLyricsJson[id as keyof typeof typedLyricsJson],
        getMasked: () => {
          const track = typedSpotifyJson.tracks[id as keyof typeof typedSpotifyJson.tracks];
          return {
            title: maskText(track.name),
            artist: maskText(track.artists[0].name),
            lyrics: maskText(typedLyricsJson[id as keyof typeof typedLyricsJson])
          };
        }
      },
      prisma: {
        song: {
          create: {
            input: () => ({
              data: {
                spotifyId: id,
                spotifyData: JSON.parse(JSON.stringify({
                  name: typedSpotifyJson.tracks[id as keyof typeof typedSpotifyJson.tracks].name,
                  artists: typedSpotifyJson.tracks[id as keyof typeof typedSpotifyJson.tracks].artists.map(a => ({ name: a.name, id: a.id })),
                  album: {
                    name: typedSpotifyJson.tracks[id as keyof typeof typedSpotifyJson.tracks].album.name,
                    images: typedSpotifyJson.tracks[id as keyof typeof typedSpotifyJson.tracks].album.images
                  },
                  preview_url: typedSpotifyJson.tracks[id as keyof typeof typedSpotifyJson.tracks].preview_url
                })),
                geniusData: JSON.parse(JSON.stringify(testCase.genius.getBestMatch())) as JsonValue,
                lyrics: typedLyricsJson[id as keyof typeof typedLyricsJson],
                maskedLyrics: JSON.parse(JSON.stringify({
                  title: maskText(typedSpotifyJson.tracks[id as keyof typeof typedSpotifyJson.tracks].name),
                  artist: maskText(typedSpotifyJson.tracks[id as keyof typeof typedSpotifyJson.tracks].artists[0].name),
                  lyrics: maskText(typedLyricsJson[id as keyof typeof typedLyricsJson])
                }))
              }
            }),
            output: (mockId: string = '1'): Song => ({
              id: mockId,
              spotifyId: id,
              spotifyData: JSON.parse(JSON.stringify(typedSpotifyJson.tracks[id as keyof typeof typedSpotifyJson.tracks])) as JsonValue,
              geniusData: JSON.parse(JSON.stringify(testCase.genius.getBestMatch())) as JsonValue,
              lyrics: typedLyricsJson[id as keyof typeof typedLyricsJson],
              maskedLyrics: testCase.lyrics.getMasked() as JsonValue,
              createdAt: new Date(),
              updatedAt: new Date()
            })
          }
        },
        game: {
          upsert: {
            input: (date: string) => ({
              where: {
                date: date
              },
              create: {
                date: date,
                songId: id
              },
              update: {
                songId: id
              }
            }),
            output: (date: string, mockId: string = '1'): GameWithSong => ({
              id: mockId,
              date,
              songId: id,
              song: {
                id: mockId,
                spotifyId: id,
                spotifyData: JSON.parse(JSON.stringify(typedSpotifyJson.tracks[id as keyof typeof typedSpotifyJson.tracks])) as JsonValue,
                geniusData: JSON.parse(JSON.stringify(testCase.genius.getBestMatch())) as JsonValue,
                lyrics: typedLyricsJson[id as keyof typeof typedLyricsJson],
                maskedLyrics: testCase.lyrics.getMasked() as JsonValue,
                createdAt: new Date(),
                updatedAt: new Date()
              },
              createdAt: new Date(),
              updatedAt: new Date()
            })
          },
          findUnique: {
            output: (date: string, mockId: string = '1'): GameWithSong => ({
              id: mockId,
              date,
              songId: id,
              song: {
                id: mockId,
                spotifyId: id,
                spotifyData: JSON.parse(JSON.stringify(typedSpotifyJson.tracks[id as keyof typeof typedSpotifyJson.tracks])) as JsonValue,
                geniusData: JSON.parse(JSON.stringify(testCase.genius.getBestMatch())) as JsonValue,
                lyrics: typedLyricsJson[id as keyof typeof typedLyricsJson],
                maskedLyrics: testCase.lyrics.getMasked() as JsonValue,
                createdAt: new Date(),
                updatedAt: new Date()
              },
              createdAt: new Date(),
              updatedAt: new Date()
            })
          }
        }
      },
      validators: {
        unit: {
          song: (actual: Song): void => {
            validators.unit.song(actual, testCase);
          },
          maskedLyrics: (actual: string): void => {
            expect(actual).toBe(maskText(typedLyricsJson[id as keyof typeof typedLyricsJson]));
          },
          game: (actual: GameWithSong): void => {
            expect(actual).toBeDefined();
            expect(actual.song).toBeDefined();
            expect(actual.song.spotifyId).toBe(id);
          },
          gameState: (actual: GameState, testCase: SongTestCase, playerId: string): void => {
            validators.unit.gameState(actual, testCase, playerId);
          }
        },
        integration: {
          song: (actual: Song): void => {
            validators.integration.song(actual, testCase);
          }
        }
      },
      scenarios: {
        /**
         * Get all scenarios this song appears in
         */
        getAll: () => {
          const songKey = Object.keys(SONG_IDS).find(key => SONG_IDS[key as keyof typeof SONG_IDS] === id);
          if (!songKey) return [];
          return Object.entries(SEED_SCENARIOS)
            .filter(([, testScenario]) => 
              (testScenario.songs as readonly string[]).includes(songKey))
            .map(([scenarioKey]) => scenarioKey as TestScenarioKey);
        },
        /**
         * Get the date this song appears on in a specific scenario
         * Returns undefined if the song is not in the scenario
         */
        getDateInScenario: (scenario: TestScenarioKey) => {
          const songKey = Object.keys(SONG_IDS).find(key => SONG_IDS[key as keyof typeof SONG_IDS] === id);
          if (!songKey) return undefined;
          const songIndex = (SEED_SCENARIOS[scenario].songs as readonly string[])
            .findIndex(s => s === songKey);
          return songIndex >= 0 ? SEED_SCENARIOS[scenario].dates[songIndex] : undefined;
        }
      },
      helpers: {
        /**
         * Create a single guess
         */
        createGuess: (word: string, playerId?: string, gameId?: string) => ({
          id: '',
          gameId: gameId || '',
          playerId: playerId || '',
          word: word,
          createdAt: new Date()
        }),
        /**
         * Create multiple guesses
         */
        createGuesses: (words: string[], playerId?: string, gameId?: string) => words.map(word => ({
          id: '',
          gameId: gameId || '',
          playerId: playerId || '',
          word: word,
          createdAt: new Date()
        })),
        /**
         * Get masked state based on guessed words
         */
        getMaskedState: (guessedWords: Set<string>) => ({
          title: maskTextWithGuesses(typedSpotifyJson.tracks[id as keyof typeof typedSpotifyJson.tracks].name, guessedWords),
          artist: maskTextWithGuesses(typedSpotifyJson.tracks[id as keyof typeof typedSpotifyJson.tracks].artists[0].name, guessedWords),
          lyrics: maskTextWithGuesses(typedLyricsJson[id as keyof typeof typedLyricsJson], guessedWords)
        }),
        /**
         * Get all valid words that can be guessed from the lyrics
         */
        getWordsToGuess: (text: string) => {
          // Get all valid words from text that can be guessed
          const words = new Set<string>();
          
          // Use regex to match all letter/number sequences
          const matches = text.toLowerCase().matchAll(/\p{L}+|\p{N}+/gu);
          for (const match of matches) {
            const word = match[0];
            if (/^[a-z]+$/.test(word)) {
              words.add(word);
            }
          }
          
          return Array.from(words);
        },
        getLyricsWords: () => {
          return testCase.helpers.getWordsToGuess(typedLyricsJson[id as keyof typeof typedLyricsJson]);
        },
        getTitleWords: () => {
          return testCase.helpers.getWordsToGuess(typedSpotifyJson.tracks[id as keyof typeof typedSpotifyJson.tracks].name);
        },
        getArtistWords: () => {
          return testCase.helpers.getWordsToGuess(typedSpotifyJson.tracks[id as keyof typeof typedSpotifyJson.tracks].artists[0].name);
        },
        getAllWords: () => {
          const words = new Set<string>();
          testCase.helpers.getLyricsWords().forEach(w => words.add(w));
          testCase.helpers.getTitleWords().forEach(w => words.add(w));
          testCase.helpers.getArtistWords().forEach(w => words.add(w));
          return Array.from(words);
        }
      }
    };

    acc[key] = testCase;
    return acc;
  },
  {}
);

// Define test scenario interface
export interface TestScenario {
  songs: readonly SongTestCase[];
  dates: readonly string[];
  seedDB: (prisma: PrismaClient) => Promise<void>;
}

// Define test scenarios using the created song test cases
export const TEST_SCENARIOS = {
  BASIC: {
    songs: [SONGS.PARTY_IN_THE_USA, SONGS.BILLIE_JEAN, SONGS.LIKE_A_PRAYER] as const,
    dates: ['2025-01-25', '2025-01-26', '2025-01-27'] as const,
    seedDB: async (prisma: PrismaClient) => {
      await seedDatabase(prisma, ['BASIC']);
    }
  },
  MIXED_LANGUAGES: {
    songs: [SONGS.LA_VIE_EN_ROSE, SONGS.SWEET_CHILD_O_MINE] as const,
    dates: ['2025-01-28', '2025-01-29'] as const,
    seedDB: async (prisma: PrismaClient) => {
      await seedDatabase(prisma, ['MIXED_LANGUAGES']);
    }
  }
} as const;

/**
 * Test case for a song
 * Provides data accessors and validators for testing
 */
export interface SongTestCase {
  id: string;
  spotify: {
    getTrack: () => Track;
    getError?: () => { status: number; message: string };
  };
  genius: {
    getSearch: () => GeniusSearchResponse;
    getBestMatch: () => {
      url: string;
      title: string;
      artist: string;
    };
  };
  lyrics: {
    get: () => string;
    getMasked: () => {
      title: string;
      artist: string;
      lyrics: string;
    };
  };
  prisma: {
    song: {
      create: {
        input: () => { 
          data: {
            spotifyId: string;
            spotifyData: unknown;
            geniusData: unknown;
            lyrics: string;
            maskedLyrics: {
              title: string;
              artist: string;
              lyrics: string;
            };
          }
        };
        output: (id?: string) => Song;
      };
    };
    game: {
      upsert: {
        input: (date: string) => {
          where: {
            date: string;
          };
          create: {
            date: string;
            songId: string;
          };
          update: {
            songId: string;
          };
        };
        output: (date: string, mockId: string) => GameWithSong;
      };
      findUnique: {
        output: (date: string, mockId: string) => GameWithSong;
      };
    };
  };
  validators: {
    unit: {
      song: (actual: Song) => void;
      maskedLyrics: (actual: string) => void;
      game: (actual: GameWithSong) => void;
      gameState: (actual: GameState, testCase: SongTestCase, playerId: string) => void;
    };
    integration: {
      song: (actual: Song) => void;
    };
  };
  scenarios: {
    /**
     * Get all scenarios this song appears in
     */
    getAll: () => TestScenarioKey[];
    /**
     * Get the date this song appears on in a specific scenario
     * Returns undefined if the song is not in the scenario
     */
    getDateInScenario: (scenario: TestScenarioKey) => string | undefined;
  };
  helpers: {
    /**
     * Create a single guess
     */
    createGuess: (word: string, playerId?: string, gameId?: string) => {
      id: string;
      gameId: string;
      playerId: string;
      word: string;
      createdAt: Date;
    };
    /**
     * Create multiple guesses
     */
    createGuesses: (words: string[], playerId?: string, gameId?: string) => Array<{
      id: string;
      gameId: string;
      playerId: string;
      word: string;
      createdAt: Date;
    }>;
    /**
     * Get masked state based on guessed words
     */
    getMaskedState: (guessedWords: Set<string>) => {
      title: string;
      artist: string;
      lyrics: string;
    };
    /**
     * Get all valid words that can be guessed from the lyrics
     */
    getWordsToGuess: (text: string) => string[];
    getLyricsWords: () => string[];
    getTitleWords: () => string[];
    getArtistWords: () => string[];
    getAllWords: () => string[];
  };
}

/**
 * Test case for a playlist
 * Provides data accessors and validators for testing
 */
export interface PlaylistTestCase {
  id: string;
  spotify: {
    getTracks: () => Track[];
    getPlaylist: () => SimplifiedPlaylist;
    getSearch: (query: string) => SimplifiedPlaylist[];
    getError?: () => { status: number; message: string };
  };
  validators: {
    unit: {
      playlist: (actual: Record<string, unknown>) => void;
      tracks: (actual: Track[]) => void;
      search: (actual: SimplifiedPlaylist[]) => void;
    };
    integration: {
      playlist: (actual: Record<string, unknown>) => void;
      tracks: (actual: Track[]) => void;
    };
  };
}

// Create playlist test cases with data accessors and validators
export const PLAYLISTS = Object.entries(PLAYLIST_IDS).reduce<Record<string, PlaylistTestCase>>((acc, [key, id]: [string, typeof PLAYLIST_IDS[keyof typeof PLAYLIST_IDS]]) => {
  const testCase: PlaylistTestCase = {
    id,
    spotify: {
      getTracks: () => typedSpotifyJson.playlistTracks[id as keyof typeof typedSpotifyJson.playlistTracks],
      getPlaylist: () => typedSpotifyJson.playlists[id as keyof typeof typedSpotifyJson.playlists],
      getSearch: (query: string) => {
        const playlists = Object.values(typedSpotifyJson.playlists);
        return playlists.filter(
          (playlist) => playlist.name.toLowerCase().includes(query.toLowerCase())
        );
      },
      getError: typedSpotifyJson.errors?.playlists[id as keyof typeof typedSpotifyJson.errors.playlists]
        ? () => typedSpotifyJson.errors!.playlists[id as keyof typeof typedSpotifyJson.errors.playlists]
        : undefined
    },
    validators: {
      unit: {
        playlist: (actual: Record<string, unknown>): void => {
          validators.unit.playlist(actual, testCase);
        },
        tracks: (actual: Track[]): void => {
          expect(actual).toEqual(typedSpotifyJson.playlistTracks[id as keyof typeof typedSpotifyJson.playlistTracks]);
        },
        search: (actual: SimplifiedPlaylist[]): void => {
          const playlists = Object.values(typedSpotifyJson.playlists);
          const expected = playlists.filter(
            (playlist) => playlist.name.toLowerCase().includes(testCase.spotify.getPlaylist().name.toLowerCase())
          );
          expect(actual).toEqual(expected);
        }
      },
      integration: {
        playlist: (actual: Record<string, unknown>): void => {
          validators.integration.playlist(actual, testCase);
        },
        tracks: (actual: Track[]): void => {
          expect(actual).toEqual(typedSpotifyJson.playlistTracks[id as keyof typeof typedSpotifyJson.playlistTracks]);
        }
      }
    }
  };
  return { ...acc, [key]: testCase };
}, {});

// Helper function to create a mock game state for testing
export function createMockGameState(testCase: SongTestCase, date: string, words: string[] = [], playerId: string = TEST_IDS.PLAYER) {
  const game = testCase.prisma.game.upsert.output(date, TEST_IDS.GAME);
  return {
    ...game,
    guesses: testCase.helpers.createGuesses(words, playerId, TEST_IDS.GAME)
  };
}

export type TestCases = {
  readonly SONGS: Record<string, SongTestCase>;
  readonly PLAYLISTS: Record<string, PlaylistTestCase>;
};

export const TEST_CASES: TestCases = {
  SONGS,
  PLAYLISTS
} as const;

// Export types
export type SongKey = keyof typeof SONGS;
export type PlaylistKey = keyof typeof PLAYLISTS;