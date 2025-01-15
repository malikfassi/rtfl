import { type NextRequest } from 'next/server';
import { getSpotifyApi } from '@/lib/spotify/auth';

type RouteContext = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<Response> {
  try {
    const { id } = context.params;
    
    // Check for empty playlist ID
    if (!id || id.trim() === '') {
      return Response.json({ error: 'Failed to get playlist' }, { status: 500 });
    }

    const spotify = await getSpotifyApi();
    const playlist = await spotify.playlists.getPlaylist(id);

    return Response.json(playlist);
  } catch (error) {
    console.error('Failed to get playlist:', error);
    return Response.json({ error: 'Failed to get playlist' }, { status: 500 });
  }
}
