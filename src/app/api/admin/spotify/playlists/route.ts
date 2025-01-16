import { spotifyClient } from '@/lib/clients/spotify';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const playlists = await spotifyClient.searchPlaylists(query);
    return Response.json(playlists);
  } catch (error) {
    console.error('Failed to fetch playlists:', error);
    return Response.json({ error: 'Failed to search playlists' }, { status: 500 });
  }
} 