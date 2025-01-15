import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(_request: NextRequest): Promise<Response> {
  try {
    const games = await prisma.game.findMany({
      include: {
        guesses: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(
      games.map((game) => ({
        ...game,
        date: game.date.toISOString(),
        createdAt: game.createdAt.toISOString(),
        updatedAt: game.updatedAt.toISOString(),
        guesses: game.guesses.map((guess) => ({
          ...guess,
          timestamp: guess.timestamp.toISOString(),
        })),
      }))
    );
  } catch (error) {
    console.error('Failed to list games:', error);
    return NextResponse.json({ error: 'Failed to list games' }, { status: 500 });
  }
}
