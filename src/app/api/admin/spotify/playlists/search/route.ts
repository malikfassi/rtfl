import { getSpotifyClient } from '@/lib/clients/spotify';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return Response.json([]);
    }

    const spotifyClient = getSpotifyClient();
    const playlists = await spotifyClient.searchPlaylists(query);
    return Response.json(playlists);
  } catch (error) {
    console.error('Failed to search playlists:', error);
    return Response.json({ error: 'Failed to search playlists' }, { status: 500 });
  }
} 