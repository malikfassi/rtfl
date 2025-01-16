import { NextRequest } from 'next/server';
import { createGameService } from '@/lib/services/game';
import { createSongService } from '@/lib/services/song';

export async function GET(req: NextRequest) {
  try {
    const songService = createSongService();
    const gameService = createGameService(songService);
    const url = new URL(req.url);
    const date = url.searchParams.get('date');
    const month = url.searchParams.get('month');

    if (!date && !month) {
      return Response.json(
        { error: 'MISSING_PARAMS', message: 'date or month parameter is required' },
        { status: 400 }
      );
    }

    if (date) {
      const game = await gameService.getByDate(date);
      return Response.json(game);
    }

    if (month) {
      const games = await gameService.getByMonth(month);
      return Response.json(games);
    }

    throw new Error('Unreachable code');
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.startsWith('NOT_FOUND')) {
        return Response.json(
          { error: 'NOT_FOUND', message: error.message },
          { status: 404 }
        );
      }
      if (error.message.startsWith('INVALID_FORMAT')) {
        return Response.json(
          { error: 'INVALID_FORMAT', message: error.message },
          { status: 400 }
        );
      }
    }
    console.error('Failed to get games:', error);
    return Response.json(
      { error: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const songService = createSongService();
    const gameService = createGameService(songService);
    const body = await req.json();
    const { date, spotifyId } = body;

    if (!date || !spotifyId) {
      return Response.json(
        { error: 'MISSING_PARAMS', message: 'date and spotifyId are required' },
        { status: 400 }
      );
    }

    const game = await gameService.createOrUpdate(date, spotifyId);
    return Response.json(game);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith('INVALID_FORMAT')) {
      return Response.json(
        { error: 'INVALID_FORMAT', message: error.message },
        { status: 400 }
      );
    }
    console.error('Failed to create game:', error);
    return Response.json(
      { error: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const songService = createSongService();
    const gameService = createGameService(songService);
    const url = new URL(req.url);
    const date = url.searchParams.get('date');

    if (!date) {
      return Response.json(
        { error: 'MISSING_PARAMS', message: 'date parameter is required' },
        { status: 400 }
      );
    }

    await gameService.delete(date);
    return new Response(null, { status: 204 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.startsWith('NOT_FOUND')) {
        return Response.json(
          { error: 'NOT_FOUND', message: error.message },
          { status: 404 }
        );
      }
      if (error.message.startsWith('INVALID_FORMAT')) {
        return Response.json(
          { error: 'INVALID_FORMAT', message: error.message },
          { status: 400 }
        );
      }
    }
    console.error('Error in DELETE /api/admin/games:', error);
    return Response.json(
      { error: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    );
  }
} 