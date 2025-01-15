import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CacheService } from '@/lib/cache';
import { z } from 'zod';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD').transform(val => val);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ date: string }> },
): Promise<NextResponse> {
  try {
    const { date } = await context.params;
    const parsedDate = dateSchema.parse(date);

    const game = await prisma.game.findFirst({
      where: { date: new Date(parsedDate) },
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found for this date' }, { status: 404 });
    }

    const cacheService = new CacheService();
    const playlist = await cacheService.getPlaylist(game.playlistId);
    
    if (!playlist || !playlist.tracks.length) {
      return NextResponse.json({ error: 'Playlist not found or empty' }, { status: 404 });
    }

    const selectedTrack = playlist.tracks[0]; // TODO: Use random seed to select track
    const lyrics = await cacheService.getLyricsBySpotifyId(selectedTrack.id);

    if (!lyrics) {
      return NextResponse.json({ error: 'Lyrics not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...game,
      playlist,
      selectedTrack,
      lyrics,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Failed to get game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createGameSchema = z.object({
  playlistId: z.string(),
  randomSeed: z.string(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ date: string }> },
): Promise<NextResponse> {
  try {
    const { date } = await context.params;
    console.log('POST request received for date:', date);
    
    const parsedDate = dateSchema.parse(date);
    console.log('Date validation passed:', parsedDate);
    
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    console.log('Request body:', body);
    
    const { playlistId, randomSeed } = createGameSchema.parse(body);
    console.log('Body validation passed:', { playlistId, randomSeed });

    const existingGame = await prisma.game.findFirst({
      where: { date: new Date(parsedDate) },
    });

    if (existingGame) {
      console.log('Game already exists for date:', parsedDate);
      return NextResponse.json(
        { error: 'Game already exists for this date' },
        { status: 409 },
      );
    }

    const game = await prisma.game.create({
      data: {
        date: new Date(parsedDate),
        playlistId,
        randomSeed,
      },
    });
    console.log('Game created successfully:', game);

    return NextResponse.json(game);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Failed to create game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const updateGameSchema = z.object({
  playlistId: z.string().optional(),
  randomSeed: z.string().optional(),
  overrideSongId: z.string().nullable().optional(),
});

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ date: string }> },
): Promise<NextResponse> {
  try {
    const { date } = await context.params;
    const parsedDate = dateSchema.parse(date);
    const body = await request.json();
    const updates = updateGameSchema.parse(body);

    const existingGame = await prisma.game.findFirst({
      where: { date: new Date(parsedDate) },
    });

    if (!existingGame) {
      return NextResponse.json({ error: 'Game not found for this date' }, { status: 404 });
    }

    const game = await prisma.game.update({
      where: { id: existingGame.id },
      data: updates,
    });

    return NextResponse.json(game);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
