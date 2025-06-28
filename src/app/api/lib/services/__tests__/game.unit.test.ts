import { describe, it, expect, beforeEach } from '@jest/globals';
import { GameService } from '../game';
import { setupUnitTest, cleanupUnitTest, type UnitTestContext } from '@/app/api/lib/test/env/unit';
import { TRACK_KEYS } from '@/app/api/lib/test/constants';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { unit_validator } from '@/app/api/lib/test/validators';
import { SongService } from '../song';
import { GameNotFoundError } from '@/app/api/lib/errors/services/game';
import { ValidationError } from '@/app/api/lib/errors/base';
import type { PrismaClient, Song, Game } from '@prisma/client';
import type { GameStats } from '@/app/types';
import type { Prisma } from '@prisma/client';

// Define the proper GameWithSong type that matches what the service returns
type GameWithSong = Game & {
  song: Song;
  stats: GameStats;
};

// Note: The linter incorrectly expects two arguments for Jest mock functions.
// These are false positives as Jest's mock functions only take one argument.
/* eslint-disable @typescript-eslint/prefer-function-type */
/* eslint-disable @typescript-eslint/unified-signatures */

describe('GameService Unit Tests', () => {
  let context: UnitTestContext;
  let service: GameService;
  let songService: SongService;

  beforeEach(() => {
    context = setupUnitTest();
    songService = new SongService(
      context.mockPrisma as unknown as PrismaClient,
      context.mockSpotifyClient,
      context.mockGeniusService
    );
    service = new GameService(songService, context.mockPrisma as unknown as PrismaClient);
  });

  afterEach(() => {
    cleanupUnitTest();
  });

  describe('fixture-driven createOrUpdate', () => {
    const keys = [
      TRACK_KEYS.PARTY_IN_THE_USA,
      TRACK_KEYS.BEAT_IT,
      TRACK_KEYS.LA_VIE_EN_ROSE
    ];
    for (const key of keys) {
      it(`creates new game when none exists for ${key}`, async () => {
        const track = fixtures.spotify.tracks[key];
        // Mock songService.create to return a song with a DB CUID
        const song: Song = {
          id: 'clrqm6nkw0011uy08kg9h1p4y', // Valid CUID
          spotifyId: track.id,
          spotifyData: {
            name: track.name,
            artists: track.artists.map(a => ({ 
              name: a.name, 
              id: a.id 
            })),
            album: {
              name: track.album.name,
              images: track.album.images
            },
            preview_url: track.preview_url
          } as unknown as Prisma.JsonValue,
          geniusData: {
            title: fixtures.genius.search[key].response.hits[0].result.title,
            artist: fixtures.genius.search[key].response.hits[0].result.primary_artist?.name || '',
            url: fixtures.genius.search[key].response.hits[0].result.url,
          } as unknown as Prisma.JsonValue,
          lyrics: fixtures.genius.lyrics[key],
          maskedLyrics: fixtures.genius.maskedLyrics[key] as unknown as Prisma.JsonValue,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        jest.spyOn(songService, 'create').mockResolvedValueOnce(song);
        (context.mockPrisma.song.findUnique as jest.Mock).mockResolvedValue(song);
        const gameResult: GameWithSong = {
          id: 'game-id',
          date: '2025-01-25',
          songId: song.id,
          song,
          createdAt: new Date(),
          updatedAt: new Date(),
          stats: {
            totalGuesses: 0,
            correctGuesses: 0,
            averageAttempts: 0,
            wins: 0,
            totalPlayers: 0,
            averageGuesses: 0,
            totalValidGuesses: 0,
            averageLyricsCompletionForWinners: 0,
            difficultyScore: 0,
          },
        };
        (context.mockPrisma.game.upsert as jest.Mock).mockResolvedValueOnce(gameResult);
        // Call songService.create with the Spotify ID, then use song.id for createOrUpdate
        const createdSong = await songService.create(track.id);
        const result = await service.createOrUpdate('2025-01-25', createdSong.id);
        unit_validator.game_service.createOrUpdate(key, result);
        expect(context.mockPrisma.game.upsert).toHaveBeenCalledWith({
          where: { date: '2025-01-25' },
          create: { date: '2025-01-25', songId: song.id },
          update: { songId: song.id },
          include: { song: true }
        });
      });
    }
  });

  describe('getByDate', () => {
    const key = TRACK_KEYS.PARTY_IN_THE_USA;
    const track = fixtures.spotify.tracks[key];
    it('returns game for date', async () => {
      const song: Song = {
        id: 'song-id',
        spotifyId: track.id,
        spotifyData: {
          name: track.name,
          artists: track.artists.map(a => ({ 
            name: a.name, 
            id: a.id 
          })),
          album: {
            name: track.album.name,
            images: track.album.images
          },
          preview_url: track.preview_url
        } as unknown as Prisma.JsonValue,
        geniusData: {
          title: fixtures.genius.search[key].response.hits[0].result.title,
          artist: fixtures.genius.search[key].response.hits[0].result.primary_artist?.name || '',
          url: fixtures.genius.search[key].response.hits[0].result.url,
        } as unknown as Prisma.JsonValue,
        lyrics: fixtures.genius.lyrics[key],
        maskedLyrics: fixtures.genius.maskedLyrics[key] as unknown as Prisma.JsonValue,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const gameResult: GameWithSong = {
        id: 'game-id',
        date: '2025-01-25',
        songId: song.id,
        song,
        createdAt: new Date(),
        updatedAt: new Date(),
        stats: {
          totalGuesses: 0,
          correctGuesses: 0,
          averageAttempts: 0,
          wins: 0,
          totalPlayers: 0,
          averageGuesses: 0,
          totalValidGuesses: 0,
          averageLyricsCompletionForWinners: 0,
          difficultyScore: 0,
        },
      };
      (context.mockPrisma.game.findUnique as jest.Mock).mockResolvedValueOnce(gameResult);
      const result = await service.getByDate('2025-01-25');
      unit_validator.game_service.getByDate(key, result);
    });
    it('throws GameNotFoundError when game not found', async () => {
      (context.mockPrisma.game.findUnique as jest.Mock).mockResolvedValueOnce(null);
      await expect(service.getByDate('2025-01-25')).rejects.toThrow(GameNotFoundError);
    });
    it('throws ValidationError when date is empty', async () => {
      await expect(service.getByDate('')).rejects.toThrow(ValidationError);
    });
  });

  describe('getByMonth', () => {
    const key = TRACK_KEYS.PARTY_IN_THE_USA;
    const track = fixtures.spotify.tracks[key];
    it('returns games for month', async () => {
      const song: Song = {
        id: 'song-id',
        spotifyId: track.id,
        spotifyData: {
          name: track.name,
          artists: track.artists.map(a => ({ 
            name: a.name, 
            id: a.id 
          })),
          album: {
            name: track.album.name,
            images: track.album.images
          },
          preview_url: track.preview_url
        } as unknown as Prisma.JsonValue,
        geniusData: {
          title: fixtures.genius.search[key].response.hits[0].result.title,
          artist: fixtures.genius.search[key].response.hits[0].result.primary_artist?.name || '',
          url: fixtures.genius.search[key].response.hits[0].result.url,
        } as unknown as Prisma.JsonValue,
        lyrics: fixtures.genius.lyrics[key],
        maskedLyrics: fixtures.genius.maskedLyrics[key] as unknown as Prisma.JsonValue,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const game1: GameWithSong = {
        id: 'game-id-1',
        date: '2025-01-25',
        songId: song.id,
        song,
        createdAt: new Date(),
        updatedAt: new Date(),
        stats: {
          totalGuesses: 0,
          correctGuesses: 0,
          averageAttempts: 0,
          wins: 0,
          totalPlayers: 0,
          averageGuesses: 0,
          totalValidGuesses: 0,
          averageLyricsCompletionForWinners: 0,
          difficultyScore: 0,
        },
      };
      const game2: GameWithSong = {
        id: 'game-id-2',
        date: '2025-01-18',
        songId: song.id,
        song,
        createdAt: new Date(),
        updatedAt: new Date(),
        stats: {
          totalGuesses: 0,
          correctGuesses: 0,
          averageAttempts: 0,
          wins: 0,
          totalPlayers: 0,
          averageGuesses: 0,
          totalValidGuesses: 0,
          averageLyricsCompletionForWinners: 0,
          difficultyScore: 0,
        },
      };
      (context.mockPrisma.game.findMany as jest.Mock).mockResolvedValueOnce([game1, game2]);
      const result = await service.getByMonth('2025-01');
      unit_validator.game_service.getByMonth(key, result);
      expect(result).toHaveLength(2);
    });
  });
});