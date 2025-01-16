import type { Game, Song } from '@prisma/client';
import type { SongService } from '@/lib/services/song';
import type { GameService } from '@/lib/services/game';

export const mockDateStr = '2025-01-16T16:37:02.951Z';
export const mockDate = new Date(mockDateStr);

export const createMockSong = (overrides: Partial<Song> = {}): Song => ({
  id: '1',
  spotifyId: 'spotify:track:1',
  title: 'Test Song',
  artist: 'Test Artist',
  previewUrl: 'https://test.com/preview.mp3',
  lyrics: 'Test lyrics',
  maskedLyrics: {
    title: 'T*** S***',
    artist: 'T*** A*****',
    lyrics: 'T*** l*****'
  },
  createdAt: mockDate,
  updatedAt: mockDate,
  ...overrides
});

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