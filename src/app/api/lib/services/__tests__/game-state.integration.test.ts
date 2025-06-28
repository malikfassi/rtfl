import {
  setupIntegrationTest,
  IntegrationTestContext
} from '@/app/api/lib/test/env/integration';
import { TRACK_KEYS } from '@/app/api/lib/test/constants';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { integration_validator } from '@/app/api/lib/test/validators';
import { GameStateService } from '../game-state';
import { GuessService } from '../guess';
import { extractLyricsFromHtml } from '../../services/lyrics';
import { GameService } from '../game';
import { createMaskedLyricsService } from '../../services/masked-lyrics';

const testDate = '2025-01-25';
const key = TRACK_KEYS.PARTY_IN_THE_USA;
const player1 = 'clrqm6nkw0011uy08kg9h1p4y';
const player2 = 'clrqm6nkw0012uy08kg9h1p4z';

const maskedLyricsService = createMaskedLyricsService();

// Helper function to submit multiple guesses
async function submitGuesses(
  guessService: GuessService,
  date: string,
  playerId: string,
  guesses: string[]
) {
  for (const guess of guesses) {
    await guessService.submitGuess({ date, userId: playerId, guess });
  }
}

describe('GameStateService Integration - Realistic Scenario', () => {
  let context: IntegrationTestContext;
  let service: GameStateService;
  let guessService: GuessService;
  let gameService: GameService;

  beforeEach(async () => {
    context = await setupIntegrationTest();
    service = new GameStateService(context.prisma);
    guessService = new GuessService(context.prisma);
    gameService = context.gameService;
    const trackId = fixtures.spotify.tracks[key].id;
    const song = await context.songService.create(trackId);
    await gameService.createOrUpdate(testDate, song.id);
  });

  afterEach(async () => {
    await context.cleanup();
  });

  it('handles realistic multi-player game flow', async () => {
    // Step 1: Both players start with no guesses
    let state1 = await service.getGameState(testDate, player1);
    let state2 = await service.getGameState(testDate, player2);
    integration_validator.game_state_service.getGameState(state1);
    integration_validator.game_state_service.getGameState(state2);
    expect(state1.guesses).toHaveLength(0);
    expect(state2.guesses).toHaveLength(0);
    expect(state1.masked).toEqual(state2.masked);

    // Step 2: Player 1 makes a valid guess
    await guessService.submitGuess({ date: testDate, userId: player1, guess: 'party' });
    state1 = await service.getGameState(testDate, player1);
    state2 = await service.getGameState(testDate, player2);
    integration_validator.game_state_service.getGameState(state1);
    integration_validator.game_state_service.getGameState(state2);
    expect(state1.guesses.map(g => g.word)).toContain('party');
    expect(state2.guesses).toHaveLength(0);
    // Player 1 should see "party" revealed, Player 2 should not
    expect(state1.masked.title[0].value).toBe('Party');
    expect(state2.masked.title[0].value).toBe('_____');

    // Step 4: Player 2 makes a wrong guess
    await submitGuesses(guessService, testDate, player2, ['wrongword']);
    state2 = await service.getGameState(testDate, player2);
    expect(state2.guesses.map(g => g.word)).toContain('wrongword');
    // Masked should still show "party" as masked since it hasn't been guessed by player 2
    expect(state2.masked.title[0].value).toBe('_____');

    // Step 5: Player 2 makes valid guesses for 'u', 's', and 'a'
    await submitGuesses(guessService, testDate, player2, ['u', 's', 'a']);
    state2 = await service.getGameState(testDate, player2);
    expect(state2.guesses.map(g => g.word)).toEqual(expect.arrayContaining(['u', 's', 'a']));
    // Should now see only 'U', 'S', and 'A' revealed, rest masked
    const guessableTitleTokens = state2.masked.title.filter(t => t.isToGuess);
    expect(guessableTitleTokens.slice(-3).map(t => t.value)).toEqual(['U', 'S', 'A']);
    expect(guessableTitleTokens.slice(0, -3).every(t => /^_+$/.test(t.value))).toBe(true);

    // Step 6: Player 1 wins by guessing all title and artist words
    const titleWords = ['party', 'in', 'the', 'u', 's', 'a'];
    const artistWords = ['miley', 'cyrus'];
    // Filter out already-guessed words for player1
    const alreadyGuessed = state1.guesses.map(g => g.word);
    const newGuesses = [...titleWords, ...artistWords].filter(word => !alreadyGuessed.includes(word));
    await submitGuesses(guessService, testDate, player1, newGuesses);
    state1 = await service.getGameState(testDate, player1);
    expect(state1.song).toBeDefined();
    integration_validator.game_state_service.getGameState(state1);

    // Step 7: Player 2 wins by guessing 80% of lyrics words
    const backendMaskedLyrics = maskedLyricsService.create(
      fixtures.genius.search[key].response.hits[0].result.title,
      fixtures.genius.search[key].response.hits[0].result.primary_artist?.name || '',
      extractLyricsFromHtml(fixtures.genius.lyrics[key])
    );
    const backendTokens = backendMaskedLyrics.lyrics
      .filter((t: { isToGuess: boolean }) => t.isToGuess)
      .map((t: { value: string }) => t.value.toLowerCase());
    console.log('Backend lyrics tokens:', backendTokens);

    // Use backend tokenization for guesses
    const uniqueLyricsWords = Array.from(new Set(backendTokens));
    console.log('Test uniqueLyricsWords:', uniqueLyricsWords);
    const wordsNeeded = Math.ceil(uniqueLyricsWords.length * 0.8);
    // Filter out already-guessed words for player2
    const alreadyGuessed2 = state2.guesses.map(g => g.word);
    const newLyricsGuesses = uniqueLyricsWords.slice(0, wordsNeeded).filter(word => !alreadyGuessed2.includes(word));
    await submitGuesses(guessService, testDate, player2, newLyricsGuesses);
    state2 = await service.getGameState(testDate, player2);
    expect(state2.song).toBeDefined();
    integration_validator.game_state_service.getGameState(state2);

    // After getting state2, print a compact log of guesses
    const compactGuesses = state2.guesses.map(g => `${g.word}:${g.valid ? '✓' : '✗'}`);
    console.log('Player 2 guesses (word:valid):', compactGuesses.join(', '));
  });

  describe('getGameStatesByMonth', () => {
    const month = '2025-01';
    const playerId = 'clrqm6nkw0011uy08kg9h1p4y';

    it('returns empty array when no games in month', async () => {
      const emptyMonth = '2024-02';
      const result = await service.getGameStatesByMonth(emptyMonth, playerId);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('returns game states for month with multiple games', async () => {
      // Create multiple games in the same month
      const dates = ['2025-01-25', '2025-01-26', '2025-01-27'];
      const keys = [TRACK_KEYS.PARTY_IN_THE_USA, TRACK_KEYS.BEAT_IT, TRACK_KEYS.LA_VIE_EN_ROSE];
      
      for (let i = 0; i < dates.length; i++) {
        const trackId = fixtures.spotify.tracks[keys[i]].id;
        const song = await context.songService.create(trackId);
        await gameService.createOrUpdate(dates[i], song.id);
      }

      const result = await service.getGameStatesByMonth(month, playerId);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
      
      // Verify dates are in ascending order
      expect(result[0].date).toBe('2025-01-25');
      expect(result[1].date).toBe('2025-01-26');
      expect(result[2].date).toBe('2025-01-27');
      
      // Validate each game state
      result.forEach(gameState => {
        integration_validator.game_state_service.getGameState(gameState);
      });
    });

    it('filters guesses by player correctly', async () => {
      // Create a game
      const trackId = fixtures.spotify.tracks[key].id;
      const song = await context.songService.create(trackId);
      await gameService.createOrUpdate(testDate, song.id);

      // Submit guesses for different players
      await submitGuesses(guessService, testDate, playerId, ['party', 'in']);
      await submitGuesses(guessService, testDate, player2, ['usa', 'the']);

      // Get game states for both players
      const player1States = await service.getGameStatesByMonth(month, playerId);
      const player2States = await service.getGameStatesByMonth(month, player2);

      expect(player1States).toHaveLength(1);
      expect(player2States).toHaveLength(1);

      // Player 1 should only see their own guesses
      const player1Guesses = player1States[0].guesses.map(g => g.word);
      expect(player1Guesses).toEqual(expect.arrayContaining(['party', 'in']));
      expect(player1Guesses).not.toEqual(expect.arrayContaining(['usa', 'the']));

      // Player 2 should only see their own guesses
      const player2Guesses = player2States[0].guesses.map(g => g.word);
      expect(player2Guesses).toEqual(expect.arrayContaining(['usa', 'the']));
      expect(player2Guesses).not.toEqual(expect.arrayContaining(['party', 'in']));
    });

    it('handles mixed month with some games having no songs', async () => {
      // Create a game with song
      const trackId = fixtures.spotify.tracks[key].id;
      const song = await context.songService.create(trackId);
      await gameService.createOrUpdate('2025-01-25', song.id);

      // Create another game with a different song
      const orphanedTrackId = fixtures.spotify.tracks[TRACK_KEYS.BEAT_IT].id;
      const orphanedSong = await context.songService.create(orphanedTrackId);
      await gameService.createOrUpdate('2025-01-26', orphanedSong.id);

      const result = await service.getGameStatesByMonth(month, playerId);
      
      // Should return both games with valid songs
      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2025-01-25');
      expect(result[1].date).toBe('2025-01-26');
      
      // Both games should have masked lyrics (song data is available but song property only shows when won)
      expect(result[0].masked).toBeDefined();
      expect(result[1].masked).toBeDefined();
      expect(result[0].masked.title).toBeDefined();
      expect(result[1].masked.title).toBeDefined();
      
      // Song property should be undefined since no one has won yet
      expect(result[0].song).toBeUndefined();
      expect(result[1].song).toBeUndefined();
    });

    it('returns games in correct date order', async () => {
      // Create games in reverse order
      const dates = ['2025-01-27', '2025-01-25', '2025-01-26'];
      const keys = [TRACK_KEYS.PARTY_IN_THE_USA, TRACK_KEYS.BEAT_IT, TRACK_KEYS.LA_VIE_EN_ROSE];
      
      for (let i = 0; i < dates.length; i++) {
        const trackId = fixtures.spotify.tracks[keys[i]].id;
        const song = await context.songService.create(trackId);
        await gameService.createOrUpdate(dates[i], song.id);
      }

      const result = await service.getGameStatesByMonth(month, playerId);
      
      // Should be ordered by date ascending
      expect(result).toHaveLength(3);
      expect(result[0].date).toBe('2025-01-25');
      expect(result[1].date).toBe('2025-01-26');
      expect(result[2].date).toBe('2025-01-27');
    });
  });
}); 