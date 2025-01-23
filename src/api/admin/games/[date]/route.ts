import { validateSchema, gameDateSchema } from '@/lib/validation';
import { withErrorHandler } from '@/lib/middleware/error';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createGameService } from '@/lib/services/game';
import { createSongService } from '@/lib/services/song';
import { ValidationError } from '@/lib/errors/base';

const requestBodySchema = z.object({
  spotifyId: z.string({
    required_error: 'Spotify ID is required'
  }).min(1, 'Spotify ID is required')
}).strict();

export const GET = withErrorHandler(async (
  req: NextRequest,
  context: { params: { date: string } }
) => {
  const validatedDate = validateSchema(gameDateSchema, context.params.date);
  const songService = createSongService();
  const gameService = createGameService(songService);
  const game = await gameService.getByDate(validatedDate);
  return Response.json(game);
});

export const POST = withErrorHandler(async (
  req: NextRequest,
  context: { params: { date: string } }
) => {
  const validatedDate = validateSchema(gameDateSchema, context.params.date);
  
  let body;
  try {
    body = await req.json();
  } catch {
    throw new ValidationError('Spotify ID is required');
  }

  const validatedBody = validateSchema(requestBodySchema, body);
  const songService = createSongService();
  const gameService = createGameService(songService);
  const game = await gameService.createOrUpdate(validatedDate, validatedBody.spotifyId);
  return Response.json(game);
}); 