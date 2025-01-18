import { Prisma } from '@prisma/client';
import type { Song, Game } from '@prisma/client';
import type { Track } from '@spotify/web-api-ts-sdk';
import type { SongService } from '@/lib/services/song';
import type { GameService } from '@/lib/services/game';

export const mockDateStr = '2025-01-16T16:37:02.951Z';
export const mockDate = new Date(mockDateStr);

// Define the raw data structure
export const mockSpotifyTrackData: Track = {
  id: 'spotify:track:1',
  name: 'Test Song',
  artists: [{ id: 'artist1', name: 'Test Artist', type: 'artist', uri: 'spotify:artist:1', href: '', external_urls: { spotify: '' } }],
  album: {
    id: 'album1',
    name: 'Test Album',
    images: [{ url: 'https://test.com/image.jpg', height: 300, width: 300 }],
    type: 'album',
    uri: 'spotify:album:1',
    href: '',
    external_urls: { spotify: '' },
    release_date: '',
    release_date_precision: 'day',
    total_tracks: 1,
    artists: [],
    album_group: 'album',
    album_type: 'album',
    available_markets: [],
    copyrights: [],
    external_ids: {
      upc: 'TEST123',
      isrc: 'TEST123',
      ean: 'TEST123'
    },
    genres: [],
    label: '',
    popularity: 0
  },
  preview_url: 'https://test.com/preview.mp3',
  uri: 'spotify:track:1',
  external_urls: {
    spotify: 'https://open.spotify.com/track/1'
  },
  type: 'track',
  href: '',
  duration_ms: 0,
  explicit: false,
  external_ids: {
    isrc: 'TEST123',
    ean: 'TEST123',
    upc: 'TEST123'
  },
  is_local: false,
  popularity: 0,
  track_number: 1,
  disc_number: 1,
  available_markets: [],
  episode: false,
  track: true
};

export const mockGeniusData = {
  id: 123,
  title: 'Test Song',
  artist_names: 'Test Artist',
  url: 'https://genius.com/test-song'
} as const;

// Helper to ensure data is JSON-compatible and properly typed for Prisma
const toJsonValue = <T>(data: T): Prisma.JsonValue => {
  return JSON.parse(JSON.stringify(data)) as Prisma.JsonValue;
};

// Create a properly typed mock song
export const createMockSong = (overrides: Partial<Song> = {}): Song => {
  const baseSong = {
    id: '1',
    spotifyId: 'spotify:track:1',
    spotifyData: toJsonValue(mockSpotifyTrackData),
    geniusData: toJsonValue(mockGeniusData),
    lyrics: 'Test lyrics',
    maskedLyrics: toJsonValue({
      title: ['T***', 'S***'],
      artist: ['T***', 'A*****'],
      lyrics: ['T***', 'l*****']
    }),
    createdAt: mockDate,
    updatedAt: mockDate
  } satisfies Song;

  return { ...baseSong, ...overrides };
};

export const createMockGame = (): Game & { song: Song } => {
  return {
    id: '1',
    date: '2024-01-01',
    songId: '1',
    createdAt: mockDate,
    updatedAt: mockDate,
    song: createMockSong()
  };
};

export const createMockSongService = (): jest.Mocked<SongService> => ({
  getOrCreate: jest.fn()
} as unknown as jest.Mocked<SongService>);

export const createMockGameService = (): jest.Mocked<GameService> => ({
  getByMonth: jest.fn(),
  getByDate: jest.fn(),
  createOrUpdate: jest.fn(),
  delete: jest.fn()
} as unknown as jest.Mocked<GameService>); 