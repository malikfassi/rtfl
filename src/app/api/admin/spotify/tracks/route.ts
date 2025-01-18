import { getSpotifyClient } from '@/lib/clients/spotify';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    if (!query) {
      return Response.json({ error: 'Missing query parameter' }, { status: 400 });
    }

    const spotifyClient = getSpotifyClient();
    const tracks = await spotifyClient.searchTracks(query);
    return Response.json(tracks);
  } catch (error) {
    console.error('Failed to search tracks:', error);
    return Response.json({ error: 'Failed to search tracks' }, { status: 500 });
  }
} 