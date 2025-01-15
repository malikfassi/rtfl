import { prisma } from './prisma';

jest.mock('./prisma', () => ({
  prisma: {
    game: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    guess: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('Database operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getGameByDate', () => {
    it('retrieves a game by date', async () => {
      const date = new Date('2024-01-14');
      const mockGame = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        date,
        playlistId: 'playlist123',
        overrideSongId: null,
        randomSeed: 'seed123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.game.findFirst as jest.Mock).mockResolvedValue(mockGame);

      const result = await prisma.game.findFirst({
        where: { date },
      });

      expect(result).toEqual(mockGame);
      expect(prisma.game.findFirst).toHaveBeenCalledWith({
        where: { date },
      });
    });
  });

  describe('getLatestGame', () => {
    it('retrieves the latest game', async () => {
      const mockGame = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        date: new Date(),
        playlistId: 'playlist123',
        overrideSongId: null,
        randomSeed: 'seed123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.game.findFirst as jest.Mock).mockResolvedValue(mockGame);

      const result = await prisma.game.findFirst({
        orderBy: { date: 'desc' },
      });

      expect(result).toEqual(mockGame);
      expect(prisma.game.findFirst).toHaveBeenCalledWith({
        orderBy: { date: 'desc' },
      });
    });
  });

  describe('getGuessesByGame', () => {
    it('retrieves guesses for a game', async () => {
      const mockGuesses = [
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          gameId: '123e4567-e89b-12d3-a456-426614174000',
          userId: 'user123',
          guess: 'test',
          timestamp: new Date(),
        },
      ];

      (prisma.guess.findMany as jest.Mock).mockResolvedValue(mockGuesses);

      const result = await prisma.guess.findMany({
        where: { gameId: '123e4567-e89b-12d3-a456-426614174000' },
        orderBy: { timestamp: 'asc' },
      });

      expect(result).toEqual(mockGuesses);
      expect(prisma.guess.findMany).toHaveBeenCalledWith({
        where: { gameId: '123e4567-e89b-12d3-a456-426614174000' },
        orderBy: { timestamp: 'asc' },
      });
    });
  });

  describe('getUserGuesses', () => {
    it('retrieves guesses for a user', async () => {
      const mockGuesses = [
        {
          id: '123e4567-e89b-12d3-a456-426614174003',
          gameId: '123e4567-e89b-12d3-a456-426614174000',
          userId: 'user123',
          guess: 'test',
          timestamp: new Date(),
        },
      ];

      (prisma.guess.findMany as jest.Mock).mockResolvedValue(mockGuesses);

      const result = await prisma.guess.findMany({
        where: { userId: 'user123', gameId: '123e4567-e89b-12d3-a456-426614174000' },
        orderBy: { timestamp: 'asc' },
      });

      expect(result).toEqual(mockGuesses);
      expect(prisma.guess.findMany).toHaveBeenCalledWith({
        where: { userId: 'user123', gameId: '123e4567-e89b-12d3-a456-426614174000' },
        orderBy: { timestamp: 'asc' },
      });
    });
  });
});
