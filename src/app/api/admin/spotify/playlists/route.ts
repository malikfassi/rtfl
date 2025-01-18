import { getSpotifyClient } from '@/lib/clients/spotify';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const spotifyClient = getSpotifyClient();
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const playlists = await spotifyClient.searchPlaylists(query);
    return Response.json(playlists);
  } catch (error) {
    console.error('Failed to fetch playlists:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to search playlists' }), 
      { status: 500 }
    );
  }
} 