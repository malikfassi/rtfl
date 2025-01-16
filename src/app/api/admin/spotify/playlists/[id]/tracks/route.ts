import { type NextRequest } from 'next/server';
import { spotifyClient } from '@/lib/clients/spotify';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const { id } = params;
    const playlist = await spotifyClient.getPlaylistTracks(id);
    return Response.json(playlist);
  } catch (error) {
    console.error('Failed to fetch playlist tracks:', error);
    return Response.json(
      { error: 'SPOTIFY_ERROR', message: 'Failed to fetch playlist tracks' },
      { status: 500 }
    );
  }
} 