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
      expect(state.spotify).toBeNull(); // Should not reveal until complete
      expect(state.genius).toBeNull(); // Should not reveal until complete
    });

    it('Should reveal Spotify and Genius content when title AND artist are complete', () => {
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
        {
          id: '4',
          userId: 'user1',
          gameId: 'game1',
          word: 'artist',
          timestamp: new Date(),
          wasCorrect: true,
        },
      ] as Array<Guess & { wasCorrect: boolean }>;

      const mockContent = {
        title: 'Hello World',
        artist: 'Test Artist',
        lyrics: 'Some lyrics',
        previewUrl: 'test-url',
        albumCover: 'test-cover',
      };

      const state = computeGameState(mockContent, mockGuesses);

      expect(state.isComplete).toBe(true);
      expect(state.spotify).toEqual({
        artistName: 'Test Artist',
        songTitle: 'Hello World',
        albumCover: 'test-cover',
        previewUrl: 'test-url',
      });
      expect(state.genius).toEqual({
        lyrics: 'Some lyrics',
      });
    });

    it('Should reveal Spotify and Genius content when 80% of lyrics are found', () => {
      const mockGuesses = [
        {
          id: '1',
          userId: 'user1',
          gameId: 'game1',
          word: 'the',
          timestamp: new Date(),
          wasCorrect: true,
        },
        {
          id: '2',
          userId: 'user1',
          gameId: 'game1',
          word: 'quick',
          timestamp: new Date(),
          wasCorrect: true,
        },
        {
          id: '3',
          userId: 'user1',
          gameId: 'game1',
          word: 'brown',
          timestamp: new Date(),
          wasCorrect: true,
        },
        {
          id: '4',
          userId: 'user1',
          gameId: 'game1',
          word: 'fox',
          timestamp: new Date(),
          wasCorrect: true,
        },
        {
          id: '5',
          userId: 'user1',
          gameId: 'game1',
          word: 'jumps',
          timestamp: new Date(),
          wasCorrect: true,
        },
      ] as Array<Guess & { wasCorrect: boolean }>;

      const mockContent = {
        title: 'Unguessed Title',
        artist: 'Unknown Artist',
        lyrics: 'the quick brown fox jumps',
        previewUrl: 'test-url',
        albumCover: 'test-cover',
      };

      const state = computeGameState(mockContent, mockGuesses);

      expect(state.isComplete).toBe(true);
      expect(state.spotify).toEqual({
        artistName: 'Unknown Artist',
        songTitle: 'Unguessed Title',
        albumCover: 'test-cover',
        previewUrl: 'test-url',
      });
      expect(state.genius).toEqual({
        lyrics: 'the quick brown fox jumps',
      });
    });

    it('Should not reveal content when progress is high but win condition not met', () => {
      const mockGuesses = [
        {
          id: '1',
          userId: 'user1',
          gameId: 'game1',
          word: 'hello',
          timestamp: new Date(),
          wasCorrect: true,
        },
      ] as Array<Guess & { wasCorrect: boolean }>;

      const mockContent = {
        title: 'Hello World',
        artist: 'Test Artist',
        lyrics: 'Hello everyone in the world',
        previewUrl: 'test-url',
        albumCover: 'test-cover',
      };

      const state = computeGameState(mockContent, mockGuesses);

      expect(state.progress.titleArtist).toBe(0.25); // 1 out of 4 words
      expect(state.progress.lyrics).toBe(0.2); // 1 out of 5 words
      expect(state.progress.overall).toBe(0.25);
      expect(state.isComplete).toBe(false);
      expect(state.spotify).toBeNull(); // Should not reveal
      expect(state.genius).toBeNull(); // Should not reveal
    });
  });
});
