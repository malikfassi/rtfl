import { spotifyClient } from '@/lib/clients/spotify';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return Response.json(
        { error: 'MISSING_PARAMS', message: 'Search query is required' },
        { status: 400 }
      );
    }

    const tracks = await spotifyClient.searchTracks(query);
    return Response.json(tracks);
  } catch (error) {
    console.error('Failed to search tracks:', error);
    return Response.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to search tracks' },
      { status: 500 }
    );
  }
} 