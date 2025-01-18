import { NextRequest } from 'next/server';
import { createGameService } from '@/lib/services/game';
import { createSongService } from '@/lib/services/song';
import { getSpotifyClient } from '@/lib/clients/spotify';
import { z } from 'zod';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'INVALID_FORMAT: Invalid date format');
const monthSchema = z.string().regex(/^\d{4}-\d{2}$/, 'INVALID_FORMAT: Invalid month format');

const createGameSchema = z.object({
  date: dateSchema,
  spotifyId: z.string().min(1, 'Required')
});

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
        // Validate date format
        dateSchema.parse(date);
        const game = await gameService.getByDate(date);
        return Response.json(game);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return Response.json(
            { error: 'INVALID_FORMAT', message: error.errors[0].message },
            { status: 400 }
          );
        }
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
        // Validate month format and range
        monthSchema.parse(month);
        const monthStr = month.split('-')[1];
        const monthNum = parseInt(monthStr, 10);
        if (monthNum < 1 || monthNum > 12) {
          return Response.json(
            { error: 'INVALID_FORMAT', message: 'Month must be between 1 and 12' },
            { status: 400 }
          );
        }

        const games = await gameService.getByMonth(month);
        return Response.json(games);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return Response.json(
            { error: 'INVALID_FORMAT', message: error.errors[0].message },
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
    console.log('Received request body:', body);

    try {
      // Validate request body
      if (!body.date || !body.spotifyId) {
        return Response.json(
          { error: 'MISSING_PARAMS', message: 'date and spotifyId are required' },
          { status: 400 }
        );
      }
      const { date, spotifyId } = createGameSchema.parse(body);

      // Get track details from Spotify
      const track = await getSpotifyClient().getTrack(spotifyId);
      if (!track) {
        return Response.json(
          { error: 'NOT_FOUND', message: 'Track not found on Spotify' },
          { status: 404 }
        );
      }

      const songService = createSongService();
      const gameService = createGameService(songService);
      
      const game = await gameService.createOrUpdate(spotifyId, date);
      return Response.json(game);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const zodError = error.errors[0];
        const errorMessage = zodError.message;
        const errorParams = zodError as { params?: { code?: string } };
        if (errorParams.params?.code === 'MISSING_PARAMS') {
          return Response.json(
            { error: 'MISSING_PARAMS', message: errorMessage },
            { status: 400 }
          );
        }
        return Response.json(
          { error: 'INVALID_FORMAT', message: errorMessage },
          { status: 400 }
        );
      }
      if (error instanceof Error) {
        if (error.message.includes('NOT_FOUND')) {
          return Response.json(
            { error: 'NOT_FOUND', message: error.message },
            { status: 404 }
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