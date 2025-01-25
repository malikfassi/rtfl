import { expect } from '@jest/globals';
import type { Game, Song } from '@prisma/client';
import type { JsonValue } from '@prisma/client/runtime/library';
import { type SimplifiedPlaylist, Track } from '@spotify/web-api-ts-sdk';

import type { GeniusSearchResponse } from '@/app/types/genius';
import type { GameState } from '@/app/api/lib/types/game';

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

// Define test scenarios
export const TEST_SCENARIOS = {
  BASIC: {
    songs: ['PARTY_IN_THE_USA', 'BILLIE_JEAN', 'LIKE_A_PRAYER'] as const,
    dates: ['2025-01-25', '2025-01-26', '2025-01-27']
  },
  MIXED_LANGUAGES: {
    songs: ['LA_VIE_EN_ROSE', 'SWEET_CHILD_O_MINE'] as const,
    dates: ['2025-01-28', '2025-01-29']
  }
} as const;

export type TestScenario = keyof typeof TEST_SCENARIOS;
export type TestSongKey = keyof typeof SONG_IDS;
export type GameWithSong = Game & { song: Song };

// Test IDs for consistent usage across tests
export const TEST_IDS = {
  GAME: 'clrqm6nkw0009uy08kg9h1p3x',
  PLAYER: 'clrqm6nkw0010uy08kg9h1p4x',
  PLAYER_2: 'clrqm6nkw0013uy08kg9h1p7x'
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
    getAll: () => TestScenario[];
    /**
     * Get the date this song appears on in a specific scenario
     * Returns undefined if the song is not in the scenario
     */
    getDateInScenario: (scenario: TestScenario) => string | undefined;
  };
  helpers: {
    createGuess: (word: string, playerId?: string, gameId?: string) => {
      id: string;
      gameId: string;
      playerId: string;
      word: string;
      createdAt: Date;
    };
    createGuesses: (words: string[], playerId?: string, gameId?: string) => Array<{
      id: string;
      gameId: string;
      playerId: string;
      word: string;
      createdAt: Date;
    }>;
    getMaskedState: (guessedWords: Set<string>) => {
      title: string;
      artist: string;
      lyrics: string;
    };
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
        getSearch: () => typedGeniusJson.byId[id as keyof typeof typedGeniusJson.byId],
        getBestMatch: () => ({
          url: typedGeniusJson.byId[id as keyof typeof typedGeniusJson.byId].response.hits[0]?.result.url,
          title: typedGeniusJson.byId[id as keyof typeof typedGeniusJson.byId].response.hits[0]?.result.title,
          artist: typedGeniusJson.byId[id as keyof typeof typedGeniusJson.byId].response.hits[0]?.result.primary_artist.name
        })
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
                geniusData: JSON.parse(JSON.stringify({
                  url: typedGeniusJson.byId[id as keyof typeof typedGeniusJson.byId].response.hits[0]?.result.url,
                  title: typedGeniusJson.byId[id as keyof typeof typedGeniusJson.byId].response.hits[0]?.result.title,
                  artist: typedGeniusJson.byId[id as keyof typeof typedGeniusJson.byId].response.hits[0]?.result.primary_artist.name
                })),
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
              geniusData: testCase.genius.getBestMatch() as JsonValue,
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
                geniusData: JSON.parse(JSON.stringify(typedGeniusJson.byId[id as keyof typeof typedGeniusJson.byId])) as JsonValue,
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
                geniusData: JSON.parse(JSON.stringify(typedGeniusJson.byId[id as keyof typeof typedGeniusJson.byId])) as JsonValue,
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
        getAll: () => {
          return Object.entries(TEST_SCENARIOS)
            .filter(([_, scenario]) => 
              (scenario.songs as readonly string[]).includes(key))
            .map(([scenarioKey]) => scenarioKey as TestScenario);
        },
        getDateInScenario: (scenario: TestScenario) => {
          const songIndex = TEST_SCENARIOS[scenario].songs
            .findIndex(songKey => songKey === key);
          return songIndex >= 0 ? TEST_SCENARIOS[scenario].dates[songIndex] : undefined;
        }
      },
      helpers: {
        createGuess: (word: string, playerId?: string, gameId?: string) => ({
          id: '',
          gameId: gameId || '',
          playerId: playerId || '',
          word: word,
          createdAt: new Date()
        }),
        createGuesses: (words: string[], playerId?: string, gameId?: string) => words.map(word => ({
          id: '',
          gameId: gameId || '',
          playerId: playerId || '',
          word: word,
          createdAt: new Date()
        })),
        getMaskedState: (guessedWords: Set<string>) => ({
          title: maskTextWithGuesses(typedSpotifyJson.tracks[id as keyof typeof typedSpotifyJson.tracks].name, guessedWords),
          artist: maskTextWithGuesses(typedSpotifyJson.tracks[id as keyof typeof typedSpotifyJson.tracks].artists[0].name, guessedWords),
          lyrics: maskTextWithGuesses(typedLyricsJson[id as keyof typeof typedLyricsJson], guessedWords)
        })
      }
    };

    acc[key] = testCase;
    return acc;
  },
  {}
);

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