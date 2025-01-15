import { z } from 'zod';
import { createGuess, getGameByDate, getCachedSpotifyTrack, getCachedLyricsBySpotifyId } from '@/lib/db';
import { computeGameState, computeRevealState, updateGameState } from '@/lib/game/state';
import type { GuessResult } from '@/types/api';
import { type NextRequest } from 'next/server';

type RouteContext = {
  params: { date: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

const guessSchema = z.object({
  word: z.string().min(1),
});

export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<Response> {
  try {
    const { date } = context.params;

    // Parse and validate request body
    const body = await request.json();
    const result = guessSchema.safeParse(body);
    if (!result.success) {
      return Response.json(
        { error: 'Invalid request body', details: result.error.issues },
        { status: 400 },
      );
    }

    // Get game with guesses
    const game = await getGameByDate(new Date(date));
    if (!game) {
      return Response.json({ error: 'Game not found' }, { status: 404 });
    }

    // Get song data from cache
    const cachedTrack = await getCachedSpotifyTrack(game.overrideSongId ?? game.playlistId);
    if (!cachedTrack) {
      return Response.json({ error: 'Song data not found' }, { status: 404 });
    }

    const songData = JSON.parse(cachedTrack.data);
    const cachedLyrics = await getCachedLyricsBySpotifyId(songData.id);
    if (!cachedLyrics) {
      return Response.json({ error: 'Lyrics not found' }, { status: 404 });
    }

    // Create guess
    const guess = await createGuess({
      gameId: game.id,
      userId: 'test-user-id', // TODO: Get from auth
      word: result.data.word,
      wasCorrect: false, // Will be updated after checking
    });

    // Get current game state
    const gameState = computeGameState(
      {
        title: songData.name,
        artist: songData.artists[0].name,
        lyrics: cachedLyrics?.lyrics ?? null,
        albumCover: songData.album?.images[0]?.url,
        previewUrl: songData.preview_url,
      },
      [...game.guesses, guess]
    );

    // Update state with new guess
    const updatedState = updateGameState(gameState, result.data.word);
    const revealState = computeRevealState(
      updatedState.maskedTitle,
      updatedState.maskedArtist,
      updatedState.maskedLyrics
    );

    const response: GuessResult = {
      guess: {
        id: guess.id,
        userId: guess.userId,
        gameId: guess.gameId,
        word: guess.word,
        timestamp: guess.timestamp.toISOString(),
        game: {
          id: game.id,
          date: game.date.toISOString(),
          playlistId: game.playlistId,
          overrideSongId: game.overrideSongId,
          selectedTrackIndex: game.selectedTrackIndex,
          createdAt: game.createdAt.toISOString(),
          updatedAt: game.updatedAt.toISOString(),
          guesses: [],
        },
        isCorrect: guess.wasCorrect,
      },
      maskedContent: {
        lyrics: updatedState.maskedLyrics,
        title: updatedState.maskedTitle,
        artist: updatedState.maskedArtist,
        progress: updatedState.progress,
        spotify: revealState.spotify ? updatedState.spotify : null,
        genius: revealState.genius ? updatedState.genius : null,
      },
    };

    return Response.json(response);
  } catch (error) {
    console.error('Failed to submit guess:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
