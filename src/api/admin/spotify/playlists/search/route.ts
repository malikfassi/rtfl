import { NextRequest } from 'next/server';
import { getSpotifyClient } from '@/lib/clients/spotify';
import { withErrorHandler } from '@/lib/middleware/error';
import { SpotifyApiError } from '@/lib/errors/spotify';
import { validateSearchParam, schemas } from '@/lib/validation';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  
  // Validate search query using shared validation
  const query = validateSearchParam(searchParams, 'q', schemas.searchQuery);

  try {
    const client = getSpotifyClient();
    const playlists = await client.searchPlaylists(query);
    return Response.json(playlists);
  } catch (error) {
    // Transform external errors at system boundary
    throw new SpotifyApiError(error instanceof Error ? error : new Error(String(error)));
  }
}); 