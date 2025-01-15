import { getGameByDate, getCachedSpotifyTrack, getCachedLyricsBySpotifyId } from '@/lib/db';
import { computeGameState, computeRevealState } from '@/lib/game/state';
import type { GameWithProgress } from '@/types/api';

export async function GET(
  request: Request,
  { params }: { params: { date: string } }
): Promise<Response> {
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
    guesses: game.guesses.map(g => ({
      id: g.id,
      userId: g.userId,
      gameId: g.gameId,
      word: g.word,
      timestamp: g.timestamp.toISOString(),
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
      wasCorrect: g.wasCorrect,
    })),
    progress: {
      totalGuesses: game.guesses.length,
      correctGuesses: game.guesses.filter(g => g.wasCorrect).length,
      isComplete: revealState.spotify && revealState.genius,
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

  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' },
  });
}
