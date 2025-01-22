import { NextRequest } from 'next/server';
import { createGameService } from '@/lib/services/game';
import { createSongService } from '@/lib/services/song';
import { getSpotifyClient } from '@/lib/clients/spotify';
import { withErrorHandler } from '@/lib/middleware/error';
import {
  GameNotFoundError,
  MissingGameDateError
} from '@/lib/errors/game';
import { validateSearchParam, validateJsonBody, schemas } from '@/lib/validation';

// Service initialization helper
function initializeServices() {
  const songService = createSongService();
  return { gameService: createGameService(songService) };
}

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const month = searchParams.get('month');

  if (!date && !month) {
    throw new MissingGameDateError();
  }

  const { gameService } = initializeServices();
  
  if (date) {
    const validDate = validateSearchParam(searchParams, 'date', schemas.date);
    const game = await gameService.getByDate(validDate);
    return Response.json(game);
  }

  if (month) {
    const validMonth = validateSearchParam(searchParams, 'month', schemas.month);
    const games = await gameService.getByMonth(validMonth);
    return Response.json(games);
  }

  return Response.json([]);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  // Parse and validate request body
  const { date, spotifyId } = await validateJsonBody(req, schemas.createGame);

  // Initialize services
  const spotifyClient = getSpotifyClient();
  const { gameService } = initializeServices();

  // Verify track exists
  const track = await spotifyClient.getTrack(spotifyId);
  if (!track) {
    throw new GameNotFoundError(spotifyId);
  }

  // Create or update game
  const game = await gameService.createOrUpdate(date, spotifyId);
  return Response.json(game);
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const date = validateSearchParam(searchParams, 'date', schemas.date);

  // Delete game
  const { gameService } = initializeServices();
  await gameService.delete(date);
  
  return new Response(null, { status: 204 });
}); 