import { 
  setupUnitTest,
  cleanupUnitTest,
  type UnitTestContext
} from '@/lib/test';
import { SongService } from '../song';
import { SpotifyError } from '@/lib/errors/spotify';
import type { Song } from '@prisma/client';
import type { JsonValue } from '@prisma/client/runtime/library';
import { spotifyData } from '@/lib/test/fixtures/spotify';
import { geniusData } from '@/lib/test/fixtures/genius';
import { getLyrics, getMaskedLyrics } from '@/lib/test/fixtures/lyrics';
import {
  SongNotFoundError,
  InvalidTrackIdError,
  NoLyricsFoundError
} from '@/lib/errors/song';
import { ValidationError } from '@/lib/errors/base';

// Mock the external clients
jest.mock('@/lib/clients/spotify', () => ({
  ...jest.requireActual('@/lib/clients/spotify'),
  getSpotifyClient: jest.fn()
}));

jest.mock('@/lib/clients/genius', () => ({
  ...jest.requireActual('@/lib/clients/genius'),
  getGeniusClient: jest.fn()
}));

describe('Song Service', () => {
  let context: UnitTestContext;
  let songService: SongService;

  beforeEach(() => {
    context = setupUnitTest();
    const { getSpotifyClient } = require('@/lib/clients/spotify');
    const { getGeniusClient } = require('@/lib/clients/genius');
    getSpotifyClient.mockReturnValue(context.mockSpotifyClient);
    getGeniusClient.mockReturnValue(context.mockGeniusClient);
    songService = new SongService(
      context.mockPrisma,
      context.mockSpotifyClient,
      context.mockGeniusClient
    );
  });

  afterEach(() => {
    cleanupUnitTest();
  });

  describe('searchTracks', () => {
    test.each(Object.keys(spotifyData.tracks))('returns tracks when search is successful for %s', async (trackId) => {
      const { mockSpotifyClient } = context;
      const track = spotifyData.tracks[trackId];
      const query = `${track.name} ${track.artists[0].name}`;
      const searchResults = spotifyData.searches[query].tracks?.items || [];
      
      mockSpotifyClient.searchTracks.mockResolvedValueOnce(searchResults);

      const result = await songService.searchTracks(query);
      expect(result).toEqual(searchResults);
      expect(mockSpotifyClient.searchTracks).toHaveBeenCalledWith(query);
    });

    test('returns empty array when no tracks found', async () => {
      const { mockSpotifyClient } = context;
      mockSpotifyClient.searchTracks.mockResolvedValueOnce([]);

      const result = await songService.searchTracks('nonexistent');
      expect(result).toEqual([]);
    });

    test('throws ValidationError when search query is empty', async () => {
      await expect(songService.searchTracks(''))
        .rejects
        .toThrow(new ValidationError('Search query is required'));
    });

    test('throws ValidationError when search query is only whitespace', async () => {
      await expect(songService.searchTracks('   '))
        .rejects
        .toThrow(new ValidationError('Search query is required'));
    });

    test('throws SpotifyError when search fails', async () => {
      const { mockSpotifyClient } = context;
      const error = new SpotifyError('Failed to search tracks');
      mockSpotifyClient.searchTracks.mockRejectedValueOnce(error);

      await expect(songService.searchTracks('test'))
        .rejects
        .toThrow(error);
    });
  });

  describe('getTrack', () => {
    test.each(Object.keys(spotifyData.tracks))('returns track when found for %s', async (trackId) => {
      const { mockSpotifyClient } = context;
      const track = spotifyData.tracks[trackId];

      mockSpotifyClient.getTrack.mockResolvedValueOnce(track);

      const result = await songService.getTrack(track.id);
      expect(result).toEqual(track);
      expect(mockSpotifyClient.getTrack).toHaveBeenCalledWith(track.id);
    });

    test('throws ValidationError when track ID is empty', async () => {
      await expect(songService.getTrack(''))
        .rejects
        .toThrow(new ValidationError('Spotify ID is required'));
    });

    test('throws SongNotFoundError when track not found', async () => {
      const { mockSpotifyClient } = context;
      mockSpotifyClient.getTrack.mockRejectedValueOnce(new SpotifyError('Track not found'));

      await expect(songService.getTrack('nonexistent'))
        .rejects
        .toThrow(new SongNotFoundError());
    });

    test('throws InvalidTrackIdError when track ID is invalid', async () => {
      const { mockSpotifyClient } = context;
      mockSpotifyClient.getTrack.mockRejectedValueOnce(
        new SpotifyError('Invalid track ID')
      );

      await expect(songService.getTrack('invalid-id'))
        .rejects
        .toThrow(new InvalidTrackIdError('invalid-id'));
    });
  });

  describe('create', () => {
    test.each(Object.keys(spotifyData.tracks))('creates song with valid track for %s', async (trackId) => {
      const { mockSpotifyClient, mockGeniusClient, mockPrisma } = context;
      const track = spotifyData.tracks[trackId];
      const lyrics = getLyrics(trackId);
      const query = `${track.name} ${track.artists[0].name}`;
      const geniusResponse = geniusData.search[query];

      mockSpotifyClient.getTrack.mockResolvedValueOnce(track);
      mockGeniusClient.searchSong.mockResolvedValueOnce(lyrics);

      const testSong: Song = {
        id: '1',
        spotifyId: track.id,
        spotifyData: JSON.parse(JSON.stringify(track)) as JsonValue,
        geniusData: JSON.parse(JSON.stringify(geniusResponse)) as JsonValue,
        lyrics,
        maskedLyrics: getMaskedLyrics(trackId),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.song.create.mockResolvedValueOnce(testSong);

      const result = await songService.create(track.id);
      expect(result.spotifyId).toBe(track.id);
      expect(result.spotifyData).toEqual(JSON.parse(JSON.stringify(track)));
      expect(result.lyrics).toBe(lyrics);
      expect(result.maskedLyrics).toEqual(getMaskedLyrics(trackId));
    });

    test.each(Object.keys(spotifyData.tracks))('throws NoLyricsFoundError when Genius search fails for %s', async (trackId) => {
      const { mockSpotifyClient, mockGeniusClient } = context;
      const track = spotifyData.tracks[trackId];
      mockSpotifyClient.getTrack.mockResolvedValueOnce(track);
      mockGeniusClient.searchSong.mockRejectedValueOnce(new Error('Genius API error'));

      await expect(songService.create(track.id))
        .rejects
        .toThrow(new NoLyricsFoundError());
    });

    test.each(Object.keys(spotifyData.tracks))('throws database error when create fails for %s', async (trackId) => {
      const { mockSpotifyClient, mockGeniusClient, mockPrisma } = context;
      const track = spotifyData.tracks[trackId];
      const lyrics = getLyrics(trackId);
      const error = new Error('Database error');

      mockSpotifyClient.getTrack.mockResolvedValueOnce(track);
      mockGeniusClient.searchSong.mockResolvedValueOnce(lyrics);
      mockPrisma.song.create.mockRejectedValueOnce(error);

      await expect(songService.create(track.id))
        .rejects
        .toThrow(error);
    });

    test.each(Object.keys(spotifyData.tracks))('handles transaction correctly for %s', async (trackId) => {
      const { mockSpotifyClient, mockGeniusClient, mockPrisma, mockTx } = context;
      const track = spotifyData.tracks[trackId];
      const lyrics = getLyrics(trackId);
      const query = `${track.name} ${track.artists[0].name}`;
      const geniusResponse = geniusData.search[query];

      mockSpotifyClient.getTrack.mockResolvedValueOnce(track);
      mockGeniusClient.searchSong.mockResolvedValueOnce(lyrics);

      const testSong: Song = {
        id: '1',
        spotifyId: track.id,
        spotifyData: JSON.parse(JSON.stringify(track)) as JsonValue,
        geniusData: JSON.parse(JSON.stringify(geniusResponse)) as JsonValue,
        lyrics,
        maskedLyrics: getMaskedLyrics(trackId),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockTx.song.create.mockResolvedValueOnce(testSong);

      const result = await songService.create(track.id, mockTx);
      expect(result.spotifyId).toBe(track.id);
      expect(mockTx.song.create).toHaveBeenCalled();
      expect(mockPrisma.song.create).not.toHaveBeenCalled();
    });
  });
}); 