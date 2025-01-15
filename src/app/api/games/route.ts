import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    // Get all games with user's guesses
    const games = await prisma.game.findMany({
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({
      games: games.map((game) => ({
        ...game,
        date: game.date.toISOString(),
        createdAt: game.createdAt.toISOString(),
        updatedAt: game.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Failed to list games:', error);
    return NextResponse.json({ error: 'Failed to list games' }, { status: 500 });
  }
}
