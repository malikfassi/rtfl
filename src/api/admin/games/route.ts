import { NextRequest } from 'next/server';
import { gameService } from '@/lib/services/game';
import { withErrorHandler } from '@/lib/middleware/error';
import { ValidationError } from '@/lib/errors/base';
import { validateSchema, gameDateSchema, gameMonthSchema, spotifyIdSchema } from '@/lib/validation';

export const GET = withErrorHandler<undefined>(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const month = searchParams.get('month');

  if (!date && !month) {
    throw new ValidationError('Expected string, received null');
  }

  if (date) {
    const validatedDate = validateSchema(gameDateSchema, date);
    const result = await gameService.getByDate(validatedDate);
    return Response.json(result);
  } else {
    const validatedMonth = validateSchema(gameMonthSchema, month);
    const result = await gameService.getByMonth(validatedMonth);
    return Response.json(result);
  }
});

export const POST = withErrorHandler<undefined>(async (request: NextRequest) => {
  const body = await request.json();
  const { date, spotifyId } = body;

  if (!date) {
    throw new ValidationError('Date is required');
  }

  if (!spotifyId) {
    throw new ValidationError('Spotify ID is required');
  }

  const validatedDate = validateSchema(gameDateSchema, date);
  const validatedSpotifyId = validateSchema(spotifyIdSchema, spotifyId);
  const game = await gameService.createOrUpdate(validatedDate, validatedSpotifyId);
  return Response.json(game);
});

export const DELETE = withErrorHandler<undefined>(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) {
    throw new ValidationError('Expected string, received null');
  }

  const validatedDate = validateSchema(gameDateSchema, date);
  const game = await gameService.delete(validatedDate);
  return Response.json({ date: game.date });
}); 