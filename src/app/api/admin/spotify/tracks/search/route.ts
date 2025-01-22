import { NextRequest } from 'next/server';
import { getSpotifyClient } from '@/lib/clients/spotify';
import { withErrorHandler } from '@/lib/middleware/error';
import { SpotifyError, MissingSearchQueryError } from '@/lib/errors/spotify';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query?.trim()) {
    throw new MissingSearchQueryError();
  }

  try {
    const client = getSpotifyClient();
    const tracks = await client.searchTracks(query.trim());
    return Response.json(tracks);
  } catch (error) {
    if (error instanceof SpotifyError) {
      throw error;
    }
    throw new SpotifyError('Failed to search tracks');
  }
}); 