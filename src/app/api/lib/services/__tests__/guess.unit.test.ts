import { GuessService } from '../guess';
import { MaskedLyricsService } from '../masked-lyrics';
import { TRACK_KEYS } from '@/app/api/lib/test/constants';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { unit_validator } from '@/app/api/lib/test/validators';
import { setupUnitTest, cleanupUnitTest, UnitTestContext } from '@/app/api/lib/test/env/unit';
import { PrismaClient } from '@prisma/client';

// Use real fixture-driven data for all tests

describe('GuessService Unit Tests', () => {
  let context: UnitTestContext;
  let service: GuessService;
  const maskedLyricsService = new MaskedLyricsService();

  // Use valid CUIDs for test IDs
  const playerId = 'clrqm6nkw0010uy08kg9h1p4x';
  const gameId = 'clrqm6nkw0009uy08kg9h1p3x';

  beforeEach(() => {
    context = setupUnitTest();
    // Cast mockPrisma to PrismaClient for type compatibility
    service = new GuessService(context.mockPrisma as unknown as PrismaClient);
  });

  afterEach(() => {
    cleanupUnitTest();
  });

  describe('fixture-driven submitGuess', () => {
    const keys = [
      TRACK_KEYS.PARTY_IN_THE_USA,
      TRACK_KEYS.BEAT_IT,
      TRACK_KEYS.LA_VIE_EN_ROSE
    ];
    for (const key of keys) {
      it(`should store and validate a valid guess for ${key}`, async () => {
        const track = fixtures.spotify.tracks[key];
        const validWord = track.name.split(' ')[0].toLowerCase();
        // Use real lyrics from fixture if available
        const lyrics = fixtures.genius.lyrics[key] || 'Test lyrics';
        const title = track.name;
        const artist = track.artists[0]?.name || '';
        // Create a real maskedLyrics object
        const maskedLyrics = maskedLyricsService.create(title, artist, lyrics);
        // Mock game lookup with real maskedLyrics
        context.mockPrisma.game.findUnique.mockResolvedValue({
          id: gameId,
          date: '2025-01-01',
          song: {
            maskedLyrics,
          },
        });
        context.mockPrisma.guess.findFirst.mockResolvedValue(null);
        const guessObj = {
          id: 'clrqm6nkw0020uy08kg9h1p5x',
          gameId,
          playerId,
          word: validWord,
          valid: true,
          createdAt: new Date()
        };
        context.mockPrisma.guess.create.mockResolvedValue(guessObj);
        // Call the service
        const result = await service.submitGuess({ date: '2025-01-01', userId: playerId, guess: validWord });
        unit_validator.guess_service.submitGuess(key, result);
      });
    }
  });

  describe('fixture-driven getPlayerGuesses', () => {
    const key = TRACK_KEYS.PARTY_IN_THE_USA;
    it('should return and validate guesses for a player', async () => {
      const track = fixtures.spotify.tracks[key];
      const guesses = [
        {
          id: 'clrqm6nkw0020uy08kg9h1p5x',
          gameId,
          playerId,
          word: 'party',
          valid: true,
          createdAt: new Date()
        },
        {
          id: 'clrqm6nkw0021uy08kg9h1p6x',
          gameId,
          playerId,
          word: 'usa',
          valid: true,
          createdAt: new Date()
        }
      ];
      context.mockPrisma.game.findUnique.mockResolvedValue({ ...track, id: gameId });
      context.mockPrisma.guess.findMany.mockResolvedValue(guesses);
      const result = await service.getPlayerGuesses(gameId, playerId);
      unit_validator.guess_service.getPlayerGuesses(key, result);
    });
  });
}); 