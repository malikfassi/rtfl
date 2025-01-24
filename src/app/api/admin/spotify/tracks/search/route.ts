// External imports
// External type imports
import type { Track } from '@spotify/web-api-ts-sdk';
import { NextResponse } from 'next/server';

// Internal imports
import { getSpotifyClient, type SpotifyClient } from '@/app/api/lib/clients/spotify';
import { handleError } from '@/app/api/lib/middleware/error';
import { schemas, validateSearchParam } from '@/app/api/lib/validation';

// These types are used for type checking the response
type ErrorResponse = { error: string };
type SuccessResponse = { tracks: Track[] };
type Response = ErrorResponse | SuccessResponse;

export async function GET(request: Request): Promise<NextResponse<Response>> {
  try {
    const { searchParams } = new URL(request.url);
    const query = validateSearchParam(searchParams, 'q', schemas.searchQuery);
    return Promise.resolve(getSpotifyClient())
      .then((client: SpotifyClient) => client.searchTracks(query))
      .then((tracks: Track[]) => NextResponse.json({ tracks }))
      .catch((error: unknown) => handleError(error));
  } catch (error) {
    return handleError(error);
  }
}