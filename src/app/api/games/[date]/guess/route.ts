import { type NextRequest, NextResponse } from 'next/server';
import { getGameByDate, createGuess } from '@/lib/db';
import { getCachedSpotifyTrack, getCachedLyricsBySpotifyId } from '@/lib/db';
import { computeGameState } from '@/lib/game/state';
import { z } from 'zod';

const guessSchema = z.object({
  word: z.string().min(1),
});

type RouteContext = {
  params: { date: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const body = await request.json();
    const { word } = guessSchema.parse(body);

    const date = new Date(params.date);
    const game = await getGameByDate(date);

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const track = await getCachedSpotifyTrack(game.playlistId);

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    const lyrics = await getCachedLyricsBySpotifyId(track.spotifyId);

    if (!lyrics) {
      return NextResponse.json({ error: 'Lyrics not found' }, { status: 404 });
    }

    const guess = await createGuess({
      gameId: game.id,
      word,
      userId: 'test-user-id',
      wasCorrect: false,
    });

    const trackData = JSON.parse(track.data);
    const gameState = computeGameState({
      title: trackData.name,
      artist: trackData.artists[0].name,
      lyrics: lyrics.lyrics,
      albumCover: trackData.album?.images[0]?.url,
      previewUrl: trackData.preview_url,
    }, [...game.guesses, guess]);

    const response = {
      guess: {
        ...guess,
        timestamp: guess.timestamp.toISOString(),
        game: {
          ...game,
          date: game.date.toISOString(),
          createdAt: game.createdAt.toISOString(),
          updatedAt: game.updatedAt.toISOString(),
          guesses: [],
        },
      },
      maskedContent: gameState,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Failed to submit guess:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
