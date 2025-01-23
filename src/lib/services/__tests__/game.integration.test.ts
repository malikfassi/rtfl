import { GameNotFoundError } from '@/lib/errors/game';
import { setupIntegrationTest, type IntegrationTestContext, cleanupIntegrationTest } from '@/lib/test/test-env/integration';
import { ValidationError } from '@/lib/errors/base';
import { TEST_CASES } from '@/lib/test/fixtures/core/test_cases';
import { TrackNotFoundError } from '@/lib/errors/spotify';

describe('GameService Integration', () => {
  let context: IntegrationTestContext;

  // Get test cases
  const validSongCase = TEST_CASES.SONGS.VALID;
  const frenchSongCase = TEST_CASES.SONGS.FRENCH;
  const unknownSongCase = TEST_CASES.SONGS.UNKNOWN_SONG;

  beforeEach(async () => {
    // Setup integration test context with clean database
    context = await setupIntegrationTest();
  });

  afterEach(async () => {
    // Cleanup test context and database
    await cleanupIntegrationTest();
  });

  describe('createOrUpdate', () => {
    it('creates a new game with a song', async () => {
      const date = '2025-01-17';
      const { id: songId } = validSongCase;

      const game = await context.gameService.createOrUpdate(date, songId);

      // Validate game and song using test case validators
      validSongCase.validators.unit.game(game);
      await validSongCase.validators.integration.song(game.song);
    });

    it('updates existing game with new song', async () => {
      const date = '2025-01-17';
      const { id: songId1 } = validSongCase;
      const { id: songId2 } = frenchSongCase;

      // Create initial game
      await context.gameService.createOrUpdate(date, songId1);

      // Update with new song
      const game = await context.gameService.createOrUpdate(date, songId2);
      frenchSongCase.validators.unit.game(game);
      await frenchSongCase.validators.integration.song(game.song);
    });

    it('throws ValidationError when date is empty', async () => {
      const { id: songId } = validSongCase;

      await expect(context.gameService.createOrUpdate('', songId))
        .rejects
        .toThrow(ValidationError);
      
      await expect(context.gameService.createOrUpdate('', songId))
        .rejects
        .toThrow('Invalid date format. Expected YYYY-MM-DD');
    });

    it('throws ValidationError when date is only whitespace', async () => {
      const { id: songId } = validSongCase;

      await expect(context.gameService.createOrUpdate('   ', songId))
        .rejects
        .toThrow(ValidationError);
      
      await expect(context.gameService.createOrUpdate('   ', songId))
        .rejects
        .toThrow('Invalid date format. Expected YYYY-MM-DD');
    });

    it('throws ValidationError for invalid date format', async () => {
      const { id: songId } = validSongCase;

      await expect(context.gameService.createOrUpdate('invalid-date', songId))
        .rejects
        .toThrow(ValidationError);
      
      await expect(context.gameService.createOrUpdate('invalid-date', songId))
        .rejects
        .toThrow('Invalid date format. Expected YYYY-MM-DD');
    });

    it('throws ValidationError when track ID is empty', async () => {
      await expect(context.gameService.createOrUpdate('2025-01-17', ''))
        .rejects
        .toThrow(ValidationError);
      
      await expect(context.gameService.createOrUpdate('2025-01-17', ''))
        .rejects
        .toThrow('Spotify ID is required');
    });

    describe('when song creation fails', () => {
      test('throws TrackNotFoundError when track does not exist', async () => {
        const date = '2024-01-01';
        const { id: songId } = unknownSongCase;
        console.log('Using unknown song ID:', songId);

        await expect(context.gameService.createOrUpdate(date, songId))
          .rejects
          .toThrow(TrackNotFoundError);
      });
    });
  });

  describe('getByDate', () => {
    it('returns game for date when found', async () => {
      const date = '2025-01-17';
      const { id: songId } = validSongCase;

      // Create game first
      await context.gameService.createOrUpdate(date, songId);

      // Then get it
      const game = await context.gameService.getByDate(date);
      validSongCase.validators.unit.game(game);
      await validSongCase.validators.integration.song(game.song);
    });

    it('throws ValidationError when date is empty', async () => {
      await expect(context.gameService.getByDate(''))
        .rejects
        .toThrow(ValidationError);
      
      await expect(context.gameService.getByDate(''))
        .rejects
        .toThrow('Invalid date format. Expected YYYY-MM-DD');
    });

    it('throws ValidationError for invalid date format', async () => {
      await expect(context.gameService.getByDate('invalid-date'))
        .rejects
        .toThrow(ValidationError);
      
      await expect(context.gameService.getByDate('invalid-date'))
        .rejects
        .toThrow('Invalid date format. Expected YYYY-MM-DD');
    });

    it('throws GameNotFoundError when game does not exist', async () => {
      await expect(context.gameService.getByDate('2025-01-17'))
        .rejects
        .toThrow(new GameNotFoundError('2025-01-17'));
    });
  });

  describe('getByMonth', () => {
    it('returns games for month when found', async () => {
      const { id: songId1 } = validSongCase;
      const { id: songId2 } = frenchSongCase;

      // Create games
      await context.gameService.createOrUpdate('2025-01-01', songId1);
      await context.gameService.createOrUpdate('2025-01-02', songId2);

      // Get games for month
      const games = await context.gameService.getByMonth('2025-01');
      expect(games).toHaveLength(2);

      // Validate games and songs using test cases
      validSongCase.validators.unit.game(games[0]);
      await validSongCase.validators.integration.song(games[0].song);
      frenchSongCase.validators.unit.game(games[1]);
      await frenchSongCase.validators.integration.song(games[1].song);
    });

    it('returns empty array when no games for month', async () => {
      const games = await context.gameService.getByMonth('2025-01');
      expect(games).toHaveLength(0);
    });

    it('throws ValidationError for invalid month format', async () => {
      await expect(context.gameService.getByMonth('invalid-month'))
        .rejects
        .toThrow(ValidationError);
      
      await expect(context.gameService.getByMonth('invalid-month'))
        .rejects
        .toThrow('Invalid month format. Expected YYYY-MM');
    });
  });
}); 