import { computeGameState } from '../state';
import type { Guess } from '@prisma/client';

describe('Game State Management', () => {
  describe('computeGameState', () => {
    it('Should reveal matched words', () => {
      const mockGuesses = [
        {
          id: '1',
          userId: 'user1',
          gameId: 'game1',
          word: 'hello',
          timestamp: new Date(),
          wasCorrect: true,
        },
        {
          id: '2',
          userId: 'user1',
          gameId: 'game1',
          word: 'world',
          timestamp: new Date(),
          wasCorrect: false,
        },
      ] as Array<Guess & { wasCorrect: boolean }>;

      const mockContent = {
        title: 'Hello World',
        artist: 'Test Artist',
        lyrics: 'Hello world, what a wonderful world',
        previewUrl: null,
      };

      const state = computeGameState(mockContent, mockGuesses);

      expect(state.maskedTitle.maskedText).toBe('Hello _____');
      expect(state.maskedArtist.maskedText).toBe('____ ______');
      expect(state.maskedLyrics?.maskedText).toBe('Hello _____, ____ _ _________ _____');
    });

    it('Should reveal Spotify at 50% progress', () => {
      const mockGuesses = [
        {
          id: '1',
          userId: 'user1',
          gameId: 'game1',
          word: 'hello',
          timestamp: new Date(),
          wasCorrect: true,
        },
        {
          id: '2',
          userId: 'user1',
          gameId: 'game1',
          word: 'world',
          timestamp: new Date(),
          wasCorrect: true,
        },
      ] as Array<Guess & { wasCorrect: boolean }>;

      const mockContent = {
        title: 'Hello World',
        artist: 'Test Artist',
        lyrics: null,
        previewUrl: 'test-url',
      };

      const state = computeGameState(mockContent, mockGuesses);

      expect(state.spotify).toEqual({
        artistName: 'Test Artist',
        songTitle: 'Hello World',
        previewUrl: 'test-url',
      });
    });

    it('Should reveal Genius at 75% progress', () => {
      const mockGuesses = [
        {
          id: '1',
          userId: 'user1',
          gameId: 'game1',
          word: 'hello',
          timestamp: new Date(),
          wasCorrect: true,
        },
        {
          id: '2',
          userId: 'user1',
          gameId: 'game1',
          word: 'world',
          timestamp: new Date(),
          wasCorrect: true,
        },
        {
          id: '3',
          userId: 'user1',
          gameId: 'game1',
          word: 'test',
          timestamp: new Date(),
          wasCorrect: true,
        },
      ] as Array<Guess & { wasCorrect: boolean }>;

      const mockContent = {
        title: 'Hello World',
        artist: 'Test',
        lyrics: 'Test lyrics',
        previewUrl: null,
      };

      const state = computeGameState(mockContent, mockGuesses);

      expect(state.genius).toEqual({
        lyrics: 'Test lyrics',
      });
    });
  });
});
