import { NextRequest } from 'next/server';
import { getSpotifyClient } from '@/lib/clients/spotify';
import { withErrorHandler } from '@/lib/middleware/error';

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const client = getSpotifyClient();
  const track = await client.getTrack(params.id);
  return Response.json(track);
}); 