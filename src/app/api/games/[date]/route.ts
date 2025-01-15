import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { computeGameState } from '@/lib/game/state';
import type { GameWithProgress, GuessResult } from '@/types/api';

const GuessSchema = z.object({
  userId: z.string(),
  word: z.string().min(1),
});

interface SpotifyTrackItem {
  track: {
    id: string;
    name: string;
    artists: { name: string }[];
    album: { images: { url: string }[] };
    preview_url: string | null;
  };
}

async function getPlaylist(playlistId: string) {
  const spotifyApi = SpotifyApi.withClientCredentials(
    process.env.SPOTIFY_CLIENT_ID!,
    process.env.SPOTIFY_CLIENT_SECRET!,
  );
  const playlist = await spotifyApi.playlists.getPlaylistItems(playlistId);
  if (!playlist) {
    throw new Error('Playlist not found');
  }
  return {
    tracks: playlist.items.map((item: SpotifyTrackItem) => ({
      id: item.track.id,
      title: item.track.name,
      artist: item.track.artists[0].name,
      albumCover: item.track.album.images[0]?.url,
      previewUrl: item.track.preview_url,
    })),
  };
}

export async function GET(
  request: Request,
  { params }: { params: { date: string } },
): Promise<NextResponse<GameWithProgress | { error: string }>> {
  try {
    const date = new Date(params.date);
    const gameWithGuesses = await prisma.game.findFirst({
      where: { date },
      include: {
        guesses: {
          select: {
            id: true,
            userId: true,
            gameId: true,
            word: true,
            timestamp: true,
            wasCorrect: true,
          },
        },
      },
    });

    if (!gameWithGuesses) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const playlist = await getPlaylist(gameWithGuesses.playlistId);
    const selectedTrack = playlist.tracks[gameWithGuesses.selectedTrackIndex];
    const cachedTrack = await prisma.cachedSpotifyTrack.findFirst({
      where: {
        spotifyId: selectedTrack.id,
      },
    });

    const cachedLyrics = cachedTrack
      ? await prisma.cachedGeniusLyrics.findUnique({
          where: {
            spotifyId: cachedTrack.spotifyId,
          },
        })
      : null;

    const gameState = computeGameState(
      {
        title: selectedTrack.title,
        artist: selectedTrack.artist,
        lyrics: cachedLyrics?.lyrics ?? null,
        albumCover: selectedTrack.albumCover,
        previewUrl: selectedTrack.previewUrl,
      },
      gameWithGuesses.guesses,
    );

    return NextResponse.json({
      id: gameWithGuesses.id,
      date: gameWithGuesses.date.toISOString(),
      playlistId: gameWithGuesses.playlistId,
      overrideSongId: gameWithGuesses.overrideSongId,
      selectedTrackIndex: gameWithGuesses.selectedTrackIndex,
      createdAt: gameWithGuesses.createdAt.toISOString(),
      updatedAt: gameWithGuesses.updatedAt.toISOString(),
      guesses: gameWithGuesses.guesses.map((g) => ({
        id: g.id,
        userId: g.userId,
        gameId: g.gameId,
        word: g.word,
        timestamp: g.timestamp.toISOString(),
        wasCorrect: g.wasCorrect,
        game: {
          id: gameWithGuesses.id,
          date: gameWithGuesses.date.toISOString(),
          playlistId: gameWithGuesses.playlistId,
          overrideSongId: gameWithGuesses.overrideSongId,
          selectedTrackIndex: gameWithGuesses.selectedTrackIndex,
          createdAt: gameWithGuesses.createdAt.toISOString(),
          updatedAt: gameWithGuesses.updatedAt.toISOString(),
          guesses: [],
        },
      })),
      progress: {
        totalGuesses: gameWithGuesses.guesses.length,
        correctGuesses: gameWithGuesses.guesses.filter((g) => g.wasCorrect).length,
        isComplete: gameState.progress >= 1,
      },
      hiddenSong: gameState,
    });
  } catch (error) {
    console.error('Failed to get game:', error);
    return NextResponse.json({ error: 'Failed to get game' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { date: string } },
): Promise<NextResponse<GuessResult | { error: string }>> {
  try {
    const body = await request.json();
    const { userId, word } = GuessSchema.parse(body);
    const { date } = params;

    const gameWithGuesses = await prisma.game.findFirst({
      where: { date: new Date(date) },
      include: {
        guesses: {
          select: {
            id: true,
            userId: true,
            gameId: true,
            word: true,
            timestamp: true,
            wasCorrect: true,
          },
        },
      },
    });

    if (!gameWithGuesses) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const playlist = await getPlaylist(gameWithGuesses.playlistId);
    const selectedTrack = playlist.tracks[gameWithGuesses.selectedTrackIndex];
    const cachedTrack = await prisma.cachedSpotifyTrack.findFirst({
      where: {
        spotifyId: selectedTrack.id,
      },
    });

    const cachedLyrics = cachedTrack
      ? await prisma.cachedGeniusLyrics.findUnique({
          where: {
            spotifyId: cachedTrack.spotifyId,
          },
        })
      : null;

    // Create guess
    const guess = await prisma.guess.create({
      data: {
        userId,
        gameId: gameWithGuesses.id,
        word,
      },
      select: {
        id: true,
        userId: true,
        gameId: true,
        word: true,
        timestamp: true,
        wasCorrect: true,
      },
    });

    const allGuesses = [...gameWithGuesses.guesses, guess];

    // Compute game state
    const gameState = computeGameState(
      {
        title: selectedTrack.title,
        artist: selectedTrack.artist,
        lyrics: cachedLyrics?.lyrics ?? null,
        albumCover: selectedTrack.albumCover,
        previewUrl: selectedTrack.previewUrl,
      },
      allGuesses,
    );

    // Check if the new guess was correct
    const normalizedWord = word.toLowerCase().trim();
    const isCorrect =
      gameState.maskedTitle.words.some((w) => w.word === normalizedWord) ||
      gameState.maskedArtist.words.some((w) => w.word === normalizedWord) ||
      (gameState.maskedLyrics?.words.some((w) => w.word === normalizedWord) ?? false);

    // Update guess with correctness
    const updatedGuess = await prisma.guess.update({
      where: { id: guess.id },
      data: { wasCorrect: isCorrect },
      select: {
        id: true,
        userId: true,
        gameId: true,
        word: true,
        timestamp: true,
        wasCorrect: true,
      },
    });

    return NextResponse.json({
      guess: {
        id: updatedGuess.id,
        userId: updatedGuess.userId,
        gameId: updatedGuess.gameId,
        word: updatedGuess.word,
        timestamp: updatedGuess.timestamp.toISOString(),
        isCorrect,
        game: {
          id: gameWithGuesses.id,
          date: gameWithGuesses.date.toISOString(),
          playlistId: gameWithGuesses.playlistId,
          overrideSongId: gameWithGuesses.overrideSongId,
          selectedTrackIndex: gameWithGuesses.selectedTrackIndex,
          createdAt: gameWithGuesses.createdAt.toISOString(),
          updatedAt: gameWithGuesses.updatedAt.toISOString(),
          guesses: [],
        },
      },
      maskedContent: {
        lyrics: gameState.maskedLyrics,
        title: gameState.maskedTitle,
        artist: gameState.maskedArtist,
        progress: gameState.progress,
        spotify: gameState.spotify,
        genius: gameState.genius,
      },
    } satisfies GuessResult);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    console.error('Failed to submit guess:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
