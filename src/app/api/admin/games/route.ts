import { NextRequest } from 'next/server';
import { createGameService } from '@/lib/services/game';
import { createSongService } from '@/lib/services/song';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const month = searchParams.get('month');

    if (!date && !month) {
      return Response.json(
        { error: 'MISSING_PARAMS', message: 'date or month parameter is required' },
        { status: 400 }
      );
    }

    const songService = createSongService();
    const gameService = createGameService(songService);
    
    if (date) {
      try {
        const game = await gameService.getByDate(date);
        return Response.json(game);
      } catch (error) {
        if (error instanceof Error && error.message.includes('NOT_FOUND')) {
          return Response.json(
            { error: 'NOT_FOUND', message: error.message },
            { status: 404 }
          );
        }
        throw error;
      }
    }

    if (month) {
      try {
        const games = await gameService.getByMonth(month);
        return Response.json(games);
      } catch (error) {
        if (error instanceof Error && error.message.includes('INVALID_FORMAT')) {
          return Response.json(
            { error: 'INVALID_FORMAT', message: error.message },
            { status: 400 }
          );
        }
        throw error;
      }
    }

    return Response.json([]);
  } catch (error) {
    console.error('Failed to fetch game:', error);
    return Response.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch game' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, spotifyId, title, artist } = body;

    if (!date || !spotifyId || !title || !artist) {
      return Response.json(
        { error: 'MISSING_PARAMS', message: 'date, spotifyId, title, and artist are required' },
        { status: 400 }
      );
    }

    const songService = createSongService();
    const gameService = createGameService(songService);
    
    try {
      const game = await gameService.createOrUpdate(spotifyId, title, artist, date);
      return Response.json(game);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('NOT_FOUND')) {
          return Response.json(
            { error: 'NOT_FOUND', message: error.message },
            { status: 404 }
          );
        }
        if (error.message.includes('INVALID_FORMAT')) {
          return Response.json(
            { error: 'INVALID_FORMAT', message: error.message },
            { status: 400 }
          );
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('Failed to create/update game:', error);
    return Response.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create/update game' },
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