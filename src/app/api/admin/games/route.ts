import { NextRequest } from 'next/server';
import { gameService } from '@/lib/services/game';
import { withErrorHandler } from '@/lib/middleware/error';

export const GET = withErrorHandler<undefined>(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const month = searchParams.get('month');

  const result = date ? 
    await gameService.getByDate(date) : 
    await gameService.getByMonth(month!);

  return Response.json(result);
});

export const POST = withErrorHandler<undefined>(async (request: NextRequest) => {
  const body = await request.json();
  const game = await gameService.createOrUpdate(body.date, body.spotifyId);
  return Response.json(game);
});

export const DELETE = withErrorHandler<undefined>(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const game = await gameService.delete(date!);
  return Response.json({ date: game.date });
}); 