// External imports
// External type imports
import type { Track } from '@spotify/web-api-ts-sdk';
import { NextResponse } from 'next/server';

// Internal imports
import { getSpotifyClient, type SpotifyClient } from '@/app/api/lib/clients/spotify';
import { handleError } from '@/app/api/lib/middleware/error';
import { spotifyIdSchema, validateSchema } from '@/app/api/lib/validation';

// These types are used for type checking the response
type ErrorResponse = { error: string };
type SuccessResponse = Track;
type Response = ErrorResponse | SuccessResponse;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<Response>> {
  try {
    const { id } = await params;
    const validatedId = validateSchema(spotifyIdSchema, id);
    return Promise.resolve(getSpotifyClient())
      .then((client: SpotifyClient) => client.getTrack(validatedId))
      .then((track: Track) => NextResponse.json(track))
      .catch((error: unknown) => handleError(error));
  } catch (error) {
    return handleError(error);
  }
} 