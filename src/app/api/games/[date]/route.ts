import { type NextRequest, NextResponse } from 'next/server';
import { getGameByDate, getCachedSpotifyTrack, getCachedLyricsBySpotifyId } from '@/lib/db';
import { computeGameState } from '@/lib/game/state';
import type { GameWithProgress } from '@/types/api';

type RouteContext = {
  params: { date: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
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

    const trackData = JSON.parse(track.data);
    const gameState = computeGameState({
      title: trackData.name,
      artist: trackData.artists[0].name,
      lyrics: lyrics.lyrics,
      albumCover: trackData.album?.images[0]?.url,
      previewUrl: trackData.preview_url,
    }, game.guesses);

    const correctGuesses = game.guesses.filter(g => g.wasCorrect).length;

    const response: GameWithProgress = {
      ...game,
      date: game.date.toISOString(),
      createdAt: game.createdAt.toISOString(),
      updatedAt: game.updatedAt.toISOString(),
      guesses: game.guesses.map((g) => ({
        ...g,
        timestamp: g.timestamp.toISOString(),
        game: {
          ...game,
          date: game.date.toISOString(),
          createdAt: game.createdAt.toISOString(),
          updatedAt: game.updatedAt.toISOString(),
          guesses: [],
        },
      })),
      progress: {
        totalGuesses: game.guesses.length,
        correctGuesses,
        isComplete: gameState.isComplete,
      },
      hiddenSong: {
        maskedTitle: gameState.maskedTitle,
        maskedArtist: gameState.maskedArtist,
        maskedLyrics: gameState.maskedLyrics,
        progress: gameState.progress,
        spotify: gameState.spotify,
        genius: gameState.genius,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to get game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
