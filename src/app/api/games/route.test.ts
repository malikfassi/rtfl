import { NextRequest } from 'next/server';
import { GET } from './route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    game: {
      findMany: jest.fn(),
    },
  },
}));

describe('GET /api/games', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should list available games', async () => {
    const mockGames = [
      {
        id: 'game1',
        date: new Date('2024-01-14'),
        playlistId: 'playlist1',
        overrideSongId: null,
        randomSeed: 'seed1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (prisma.game.findMany as jest.Mock).mockResolvedValue(mockGames);

    const request = new NextRequest('http://localhost:3000/api/games');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      games: mockGames.map((game) => ({
        ...game,
        date: game.date.toISOString(),
        createdAt: game.createdAt.toISOString(),
        updatedAt: game.updatedAt.toISOString(),
      })),
    });
  });

  it('should handle database errors', async () => {
    (prisma.game.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/games');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to list games' });
  });

  it('should handle empty game list', async () => {
    (prisma.game.findMany as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/games');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ games: [] });
  });
});
