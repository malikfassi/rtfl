import { GuessService } from '../guess';
import { setupIntegrationTest, cleanupIntegrationTest, IntegrationTestContext } from '@/app/api/lib/test/env/integration';
import { TRACK_KEYS } from '@/app/api/lib/test/constants';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { integration_validator } from '@/app/api/lib/test/validators';
import { PrismaClient } from '@prisma/client';

describe('GuessService Integration', () => {
  let context: IntegrationTestContext;
  let service: GuessService;
  let prisma: PrismaClient;

  // Use valid CUIDs for test IDs
  const playerId = 'clrqm6nkw0010uy08kg9h1p4x';
  const gameId = 'clrqm6nkw0009uy08kg9h1p3x';
  const date = '2025-01-25';

  beforeEach(async () => {
    context = await setupIntegrationTest();
    service = new GuessService(context.prisma);
    prisma = context.prisma;
    // Seed a game and song using fixture data
    const track = fixtures.spotify.tracks[TRACK_KEYS.PARTY_IN_THE_USA];
    const lyrics = fixtures.genius.lyrics[TRACK_KEYS.PARTY_IN_THE_USA] || 'Test lyrics';
    const maskedLyrics = fixtures.genius.maskedLyrics[TRACK_KEYS.PARTY_IN_THE_USA];
    await prisma.game.create({
      data: {
        id: gameId,
        date,
        song: {
          create: {
            spotifyId: track.id,
            spotifyData: JSON.parse(JSON.stringify(track)),
            geniusData: {},
            lyrics,
            maskedLyrics,
          },
        },
      },
      include: { song: true },
    });
  });

  afterEach(async () => {
    await cleanupIntegrationTest();
  });

  describe('submitGuess', () => {
    it('stores and validates a valid guess', async () => {
      const validWord = 'party';
      const result = await service.submitGuess({ date, userId: playerId, guess: validWord });
      integration_validator.guess_service.submitGuess(result);
    });

    it('stores and validates an invalid guess', async () => {
      const invalidWord = 'notaword';
      const result = await service.submitGuess({ date, userId: playerId, guess: invalidWord });
      integration_validator.guess_service.submitGuess(result);
      expect(result.valid).toBe(false);
    });

    it('throws on duplicate guess', async () => {
      const validWord = 'party';
      await service.submitGuess({ date, userId: playerId, guess: validWord });
      await expect(service.submitGuess({ date, userId: playerId, guess: validWord }))
        .rejects.toThrow();
    });
  });

  describe('getPlayerGuesses', () => {
    it('returns and validates guesses for a player', async () => {
      // Add guesses
      await service.submitGuess({ date, userId: playerId, guess: 'party' });
      await service.submitGuess({ date, userId: playerId, guess: 'usa' });
      const guesses = await service.getPlayerGuesses(gameId, playerId);
      expect(guesses.length).toBeGreaterThanOrEqual(2);
      guesses.forEach(g => integration_validator.guess_service.submitGuess(g));
    });
  });
}); 