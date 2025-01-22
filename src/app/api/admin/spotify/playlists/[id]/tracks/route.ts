import { NextRequest } from 'next/server';
import { getSpotifyClient } from '@/lib/clients/spotify';
import { withErrorHandler } from '@/lib/middleware/error';
import { PlaylistNotFoundError, PlaylistTracksError } from '@/lib/errors/spotify';
import { validateSchema, schemas } from '@/lib/validation';

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  // Validate playlist ID using shared validation
  const id = validateSchema(schemas.playlistId, params.id);

  try {
    const client = getSpotifyClient();
    const tracks = await client.getPlaylistTracks(id);
    
    if (!tracks) {
      throw new PlaylistNotFoundError();
    }

    return Response.json(tracks);
  } catch (error) {
    // Transform external errors at system boundary
    if (error instanceof Error && error.message.includes('NOT_FOUND')) {
      throw new PlaylistNotFoundError();
    }
    throw new PlaylistTracksError(error instanceof Error ? error : new Error(String(error)));
  }
}); 