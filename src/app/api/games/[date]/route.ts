import { NextResponse } from 'next/server';
import { getGameByDate, getCachedSpotifyTrack, getCachedLyricsBySpotifyId } from '@/lib/db';
import { computeGameState, computeRevealState } from '@/lib/game/state';
import type { GameWithProgress } from '@/types/api';

export async function GET(
  _request: Request,
  { params }: { params: { date: string } }
): Promise<Response> {
  try {
    const game = await getGameByDate(new Date(params.date));
    if (!game) {
      return new Response('Game not found', { status: 404 });
    }

    // Get song data from cache
    const cachedTrack = await getCachedSpotifyTrack(game.overrideSongId ?? game.playlistId);
    if (!cachedTrack) {
      return new Response('Song data not found', { status: 404 });
    }

    const songData = JSON.parse(cachedTrack.data);
    const cachedLyrics = await getCachedLyricsBySpotifyId(songData.id);
    if (!cachedLyrics) {
      return new Response('Lyrics not found', { status: 404 });
    }

    // Compute game state
    const gameState = computeGameState(
      {
        title: songData.name,
        artist: songData.artists[0].name,
        lyrics: cachedLyrics?.lyrics ?? null,
        albumCover: songData.album?.images[0]?.url,
        previewUrl: songData.preview_url,
      },
      game.guesses
    );

    const revealState = computeRevealState(
      gameState.maskedTitle,
      gameState.maskedArtist,
      gameState.maskedLyrics
    );

    const response: GameWithProgress = {
      id: game.id,
      date: game.date.toISOString(),
      playlistId: game.playlistId,
      overrideSongId: game.overrideSongId,
      selectedTrackIndex: game.selectedTrackIndex,
      createdAt: game.createdAt.toISOString(),
      updatedAt: game.updatedAt.toISOString(),
      guesses: game.guesses.map((guess) => ({
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
        wasCorrect: guess.wasCorrect,
      })),
      progress: {
        totalGuesses: game.guesses.length,
        correctGuesses: game.guesses.filter((g) => g.wasCorrect).length,
        isComplete: gameState.isComplete,
      },
      hiddenSong: {
        maskedLyrics: gameState.maskedLyrics,
        maskedTitle: gameState.maskedTitle,
        maskedArtist: gameState.maskedArtist,
        progress: gameState.progress,
        spotify: revealState.spotify ? gameState.spotify : null,
        genius: revealState.genius ? gameState.genius : null,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to get game:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
