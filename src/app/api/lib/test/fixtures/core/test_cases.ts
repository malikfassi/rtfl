import { expect } from '@jest/globals';
import type { Game,Song } from '@prisma/client';
import type { JsonValue } from '@prisma/client/runtime/library';
import { type SimplifiedPlaylist,Track } from '@spotify/web-api-ts-sdk';

import type { GeniusSearchResponse } from '@/app/types/genius';

import geniusJson from '../data/genius.json';
import lyricsJson from '../data/lyrics.json';
// Import JSON data
import spotifyJson from '../data/spotify.json';
import { PLAYLIST_IDS,SONG_IDS } from '../spotify_ids';
import type { GeniusFixtures, LyricsFixtures,SpotifyFixtures } from './types';
import { validators } from './validators';

// Type assertions with runtime validation
const typedSpotifyJson = JSON.parse(JSON.stringify(spotifyJson)) as SpotifyFixtures;
const typedGeniusJson = JSON.parse(JSON.stringify(geniusJson)) as GeniusFixtures;
const typedLyricsJson = JSON.parse(JSON.stringify(lyricsJson)) as LyricsFixtures;

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
        output: (date: string, id?: string) => GameWithSong;
      };
      findUnique: {
        output: (date: string, id?: string) => GameWithSong;
      };
    };
  };
  validators: {
    unit: {
      song: (actual: Song) => void;
      maskedLyrics: (actual: string) => void;
      game: (actual: GameWithSong) => void;
    };
    integration: {
      song: (actual: Song) => void;
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
  return text.replace(/([a-zA-Z\d]|[à-ü]|[À-Ü])/g, '_');
}

// Create song test cases with data accessors and validators
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
        getSearch: () => typedGeniusJson.byId[id as keyof typeof typedGeniusJson.byId]
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
            output: (mockId: string = '1') => ({
              id: mockId,
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
              })),
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
          }
        },
        integration: {
          song: (actual: Song): void => {
            validators.integration.song(actual, testCase);
          }
        }
      }
    };
    return { ...acc, [key]: testCase };
  }, {});

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

export type GameWithSong = Game & { song: Song };

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