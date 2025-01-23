import { NextRequest } from 'next/server';
import { getSpotifyClient } from '@/lib/clients/spotify';
import { withErrorHandler } from '@/lib/middleware/error';
import { validateSearchParam, searchQuerySchema } from '@/lib/validation';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const query = validateSearchParam(searchParams, 'q', searchQuerySchema);

  const client = getSpotifyClient();
  const tracks = await client.searchTracks(query);
  return Response.json(tracks);
}); 