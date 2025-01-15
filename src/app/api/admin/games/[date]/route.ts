import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { CacheService } from '../../../../../lib/cache';
import { z } from 'zod';
import type { Game, Guess } from '@prisma/client';

const CreateGameSchema = z.object({
  playlistId: z.string(),
  overrideSongId: z.string().optional(),
  randomSeed: z.string(),
});

const UpdateGameSchema = z.object({
  playlistId: z.string().optional(),
  overrideSongId: z.string().optional(),
});

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

function validateDate(date: string): boolean {
  return dateRegex.test(date);
}

export async function GET(request: NextRequest, { params }: { params: { date: string } }) {
  try {
    const { date } = params;

    // Validate date format
    if (!validateDate(date)) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
    }

    // Get game with guesses
    const game = (await prisma.game.findFirst({
      where: { date: new Date(date) },
      include: {
        guesses: true,
      },
    })) as Game & { guesses: Array<Guess & { wasCorrect: boolean }> };

    if (!game) {
      return NextResponse.json({ error: 'Game not found for this date' }, { status: 404 });
    }

    // Get playlist data
    const cache = new CacheService();
    const playlist = await cache.getPlaylist(game.playlistId);
    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found in cache' }, { status: 404 });
    }

    // Get selected track
    const selectedTrack = game.overrideSongId
      ? playlist.tracks.find((track) => track.id === game.overrideSongId)
      : playlist.tracks[Math.floor(Math.random() * playlist.tracks.length)];

    if (!selectedTrack) {
      return NextResponse.json({ error: 'Selected track not found in playlist' }, { status: 404 });
    }

    // Get lyrics
    const lyrics = await cache.getLyricsBySpotifyId(selectedTrack.id);
    if (!lyrics) {
      return NextResponse.json({ error: 'Lyrics not found for selected track' }, { status: 404 });
    }

    // Compute statistics
    const uniqueUsers = new Set(game.guesses.map((g) => g.userId));
    const totalGuesses = game.guesses.length;
    const winningGuesses = game.guesses.filter((g) => g.wasCorrect).length;

    return NextResponse.json({
      ...game,
      date: game.date.toISOString(),
      createdAt: game.createdAt.toISOString(),
      updatedAt: game.updatedAt.toISOString(),
      playlist: {
        id: playlist.id,
        name: playlist.name,
        trackCount: playlist.tracks.length,
        tracks: playlist.tracks,
      },
      selectedTrack,
      lyrics,
      stats: {
        totalPlayers: uniqueUsers.size,
        totalGuesses,
        winningGuesses,
        completionRate: totalGuesses > 0 ? winningGuesses / uniqueUsers.size : 0,
      },
      guesses: game.guesses.map((guess) => ({
        id: guess.id,
        userId: guess.userId,
        word: guess.word,
        wasCorrect: guess.wasCorrect,
        timestamp: guess.timestamp.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Failed to get game:', error);
    return NextResponse.json({ error: 'Failed to get game' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { date: string } }) {
  try {
    const { date } = params;

    // Validate date format
    if (!validateDate(date)) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
    }

    // Parse and validate request body
    const body = await request.json();
    const result = CreateGameSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.issues },
        { status: 400 },
      );
    }

    // Check if game already exists for this date
    const existingGame = await prisma.game.findFirst({
      where: { date: new Date(date) },
    });

    if (existingGame) {
      return NextResponse.json({ error: 'Game already exists for this date' }, { status: 409 });
    }

    // Verify playlist exists in cache
    const cache = new CacheService();
    const playlist = await cache.getPlaylist(result.data.playlistId);
    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found in cache' }, { status: 404 });
    }

    // If override song is provided, verify it exists in the playlist
    if (result.data.overrideSongId) {
      const songExists = playlist.tracks.some((track) => track.id === result.data.overrideSongId);
      if (!songExists) {
        return NextResponse.json({ error: 'Override song not found in playlist' }, { status: 404 });
      }
    }

    // Create new game
    const game = await prisma.game.create({
      data: {
        date: new Date(date),
        playlistId: result.data.playlistId,
        overrideSongId: result.data.overrideSongId,
        randomSeed: result.data.randomSeed,
      },
    });

    return NextResponse.json({
      ...game,
      date: game.date.toISOString(),
      createdAt: game.createdAt.toISOString(),
      updatedAt: game.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Failed to create game:', error);
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { date: string } }) {
  try {
    const { date } = params;

    // Validate date format
    if (!validateDate(date)) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
    }

    // Parse and validate request body
    const body = await request.json();
    const result = UpdateGameSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.issues },
        { status: 400 },
      );
    }

    // Get existing game
    const existingGame = await prisma.game.findFirst({
      where: { date: new Date(date) },
    });

    if (!existingGame) {
      return NextResponse.json({ error: 'Game not found for this date' }, { status: 404 });
    }

    // Verify playlist exists in cache if updating
    const cache = new CacheService();
    if (result.data.playlistId) {
      const playlist = await cache.getPlaylist(result.data.playlistId);
      if (!playlist) {
        return NextResponse.json({ error: 'Playlist not found in cache' }, { status: 404 });
      }

      // If override song is provided, verify it exists in the playlist
      if (result.data.overrideSongId) {
        const songExists = playlist.tracks.some((track) => track.id === result.data.overrideSongId);
        if (!songExists) {
          return NextResponse.json(
            { error: 'Override song not found in playlist' },
            { status: 404 },
          );
        }
      }
    }

    // Update game
    const game = await prisma.game.update({
      where: { id: existingGame.id },
      data: {
        playlistId: result.data.playlistId,
        overrideSongId: result.data.overrideSongId,
      },
    });

    return NextResponse.json({
      ...game,
      date: game.date.toISOString(),
      createdAt: game.createdAt.toISOString(),
      updatedAt: game.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Failed to update game:', error);
    return NextResponse.json({ error: 'Failed to update game' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { date: string } }) {
  try {
    const { date } = params;

    // Validate date format
    if (!validateDate(date)) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
    }

    // Get existing game
    const existingGame = await prisma.game.findFirst({
      where: { date: new Date(date) },
    });

    if (!existingGame) {
      return NextResponse.json({ error: 'Game not found for this date' }, { status: 404 });
    }

    // Generate new random seed
    const newSeed = Math.random().toString(36).substring(2);

    // Update game with new seed
    const game = await prisma.game.update({
      where: { id: existingGame.id },
      data: { randomSeed: newSeed },
    });

    return NextResponse.json({
      ...game,
      date: game.date.toISOString(),
      createdAt: game.createdAt.toISOString(),
      updatedAt: game.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Failed to refresh game seed:', error);
    return NextResponse.json({ error: 'Failed to refresh game seed' }, { status: 500 });
  }
}
