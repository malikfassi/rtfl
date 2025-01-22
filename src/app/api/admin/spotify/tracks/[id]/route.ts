import { NextRequest } from 'next/server';
import { getSpotifyClient } from '@/lib/clients/spotify';
import { withErrorHandler } from '@/lib/middleware/error';
import { TrackNotFoundError, SpotifyApiError } from '@/lib/errors/spotify';
import { validateSchema, schemas } from '@/lib/validation';

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  // Validate track ID using shared validation
  const id = validateSchema(schemas.spotifyId, params.id);

  try {
    const client = getSpotifyClient();
    const track = await client.getTrack(id);
    
    if (!track) {
      throw new TrackNotFoundError();
    }

    return Response.json(track);
  } catch (error) {
    // Transform external errors at system boundary
    if (error instanceof Error && error.message.includes('NOT_FOUND')) {
      throw new TrackNotFoundError();
    }
    throw new SpotifyApiError(error instanceof Error ? error : new Error(String(error)));
  }
}); 