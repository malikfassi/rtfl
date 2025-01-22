import { NextRequest } from 'next/server';
import { gameService } from '@/lib/services/game';

function handleError(error: Error) {
  const status = error.name === 'GameNotFoundError' ? 404 : 400;
  return Response.json({ error: error.message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const month = searchParams.get('month');

    const result = date ? 
      await gameService.getByDate(date) : 
      await gameService.getByMonth(month!);

    return Response.json(result);
  } catch (error) {
    return handleError(error as Error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const game = await gameService.createOrUpdate(body.date, body.spotifyId);
    return Response.json(game);
  } catch (error) {
    return handleError(error as Error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    await gameService.delete(date!);
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleError(error as Error);
  }
} 