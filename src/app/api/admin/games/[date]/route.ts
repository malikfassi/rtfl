import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD');

const bodySchema = z.object({
  playlistId: z.string(),
  randomSeed: z.string(),
  overrideSongId: z.string().nullable().optional(),
});

type RouteRequest = NextRequest | { json(): Promise<Record<string, unknown>>; nextUrl: URL };

export async function GET(request: RouteRequest, { params }: { params: { date: string } }) {
  try {
    const parsedDate = dateSchema.parse(params.date);

    const game = await prisma.game.findUnique({
      where: { date: new Date(parsedDate) },
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    return NextResponse.json(game);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Failed to get game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: RouteRequest, { params }: { params: { date: string } }) {
  try {
    const parsedDate = dateSchema.parse(params.date);
    const body = await request.json();
    const { playlistId, randomSeed } = bodySchema.parse(body);

    const existingGame = await prisma.game.findUnique({
      where: { date: new Date(parsedDate) },
    });

    if (existingGame) {
      return NextResponse.json({ error: 'Game already exists for this date' }, { status: 400 });
    }

    const game = await prisma.game.create({
      data: {
        date: new Date(parsedDate),
        playlistId,
        randomSeed,
      },
    });

    return NextResponse.json(game);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Failed to create game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: RouteRequest, { params }: { params: { date: string } }) {
  try {
    const parsedDate = dateSchema.parse(params.date);
    const body = await request.json();
    const { playlistId, randomSeed, overrideSongId } = bodySchema.parse(body);

    const existingGame = await prisma.game.findUnique({
      where: { date: new Date(parsedDate) },
    });

    if (!existingGame) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const game = await prisma.game.update({
      where: { date: new Date(parsedDate) },
      data: {
        playlistId,
        randomSeed,
        overrideSongId,
      },
    });

    return NextResponse.json(game);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Failed to update game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
