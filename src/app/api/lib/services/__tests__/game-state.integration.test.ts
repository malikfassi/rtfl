import { ValidationError } from '@/app/api/lib/errors/base';
import { GameNotFoundError } from '@/app/api/lib/errors/services/game';
import {
  cleanupIntegrationTest,
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
import { maskedLyricsService } from '../../services/masked-lyrics';

const testDate = '2025-01-25';
const key = TRACK_KEYS.PARTY_IN_THE_USA;
const player1 = 'clrqm6nkw0011uy08kg9h1p4y';
const player2 = 'clrqm6nkw0012uy08kg9h1p4z';

// Inline helpers
async function createGameWithFixtureSong(context: IntegrationTestContext, key: string, date: string) {
  await context.prisma.game.create({
    data: {
      id: 'game-id',
      date,
      song: {
        create: {
          id: 'song-id',
          spotifyId: fixtures.spotify.tracks[key].id,
          spotifyData: JSON.stringify(fixtures.spotify.tracks[key]),
          geniusData: {
            title: fixtures.genius.search[key].response.hits[0].result.title,
            artist: fixtures.genius.search[key].response.hits[0].result.primary_artist?.name || '',
            url: fixtures.genius.search[key].response.hits[0].result.url,
          },
          lyrics: extractLyricsFromHtml(fixtures.genius.lyrics[key]),
          maskedLyrics: fixtures.genius.maskedLyrics[key],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    include: { song: true },
  });
  const game = await context.prisma.game.findFirst({ where: { date } });
  if (!game) throw new Error('Failed to find seeded game');
  return game.id;
}

async function submitGuesses(guessService: GuessService, date: string, playerId: string, words: string[]) {
  for (const word of words) {
    try {
      await guessService.submitGuess({ date, userId: playerId, guess: word });
    } catch (e) {
      // Ignore duplicate errors for test purposes
    }
  }
}

describe('GameStateService Integration - Realistic Scenario', () => {
  let context: IntegrationTestContext;
  let service: GameStateService;
  let guessService: GuessService;
  let gameService: GameService;
  let gameId: string;

  beforeEach(async () => {
    context = await setupIntegrationTest();
    service = new GameStateService(context.prisma);
    guessService = new GuessService(context.prisma);
    gameService = context.gameService;
    const trackId = fixtures.spotify.tracks[key].id;
    const song = await context.songService.create(trackId);
    const game = await gameService.createOrUpdate(testDate, song.id);
    gameId = game.id;
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
    await submitGuesses(guessService, testDate, player1, ['party']);
    state1 = await service.getGameState(testDate, player1);
    state2 = await service.getGameState(testDate, player2);
    integration_validator.game_state_service.getGameState(state1);
    integration_validator.game_state_service.getGameState(state2);
    expect(state1.guesses.map(g => g.word)).toContain('party');
    expect(state2.guesses).toHaveLength(0);

    // Step 4: Player 2 makes a wrong guess
    await submitGuesses(guessService, testDate, player2, ['wrongword']);
    state2 = await service.getGameState(testDate, player2);
    expect(state2.guesses.map(g => g.word)).toContain('wrongword');
    // Masked should not reveal anything new
    expect(state2.masked).toEqual(state1.masked); // since wrong guess

    // Step 5: Player 2 makes a valid guess
    await submitGuesses(guessService, testDate, player2, ['usa']);
    state2 = await service.getGameState(testDate, player2);
    expect(state2.guesses.map(g => g.word)).toContain('usa');

    // Step 6: Player 1 wins by guessing all title and artist words
    const titleWords = ['party', 'in', 'the', 'u', 's', 'a'];
    const artistWords = ['miley', 'cyrus'];
    await submitGuesses(guessService, testDate, player1, [...titleWords, ...artistWords]);
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
    await submitGuesses(guessService, testDate, player2, uniqueLyricsWords.slice(0, wordsNeeded));
    state2 = await service.getGameState(testDate, player2);
    expect(state2.song).toBeDefined();
    integration_validator.game_state_service.getGameState(state2);

    // After getting state2, print a compact log of guesses
    const compactGuesses = state2.guesses.map(g => `${g.word}:${g.valid ? '✓' : '✗'}`);
    console.log('Player 2 guesses (word:valid):', compactGuesses.join(', '));
  });
}); 