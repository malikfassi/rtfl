import { NextRequest, NextResponse } from 'next/server';
import { getSpotifyApi } from '@/lib/spotify/auth';
import { type SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('query');

    if (!query) {
      return NextResponse.json({ error: 'Invalid search parameters' }, { status: 400 });
    }

    const spotifyApi = await getSpotifyApi();

    // Limit must be one of the specific values allowed by Spotify SDK
    const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get('limit')) || 20, 1), 50) as 20;
    const offset = Number(request.nextUrl.searchParams.get('offset')) || 0;

    const searchResults = await spotifyApi.search(query, ['playlist'], undefined, limit, offset);

    // Validate search results structure
    if (!searchResults?.playlists?.items) {
      console.error('Invalid search results structure:', searchResults);
      return NextResponse.json({ error: 'Invalid search results from Spotify' }, { status: 500 });
    }

    return NextResponse.json(
      {
        items: searchResults.playlists.items
          .filter(playlist => playlist && typeof playlist === 'object')
          .map((playlist) => ({
            id: playlist.id,
            name: playlist.name,
            description: playlist.description,
            owner: playlist.owner ? {
              id: playlist.owner.id,
              name: playlist.owner.display_name,
            } : null,
            images: playlist.images || [],
            totalTracks: (playlist as SimplifiedPlaylist).tracks?.total ?? 0,
          })),
        total: searchResults.playlists.total || 0,
        limit,
        offset,
        next: searchResults.playlists.next || null,
        previous: searchResults.playlists.previous || null,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Failed to search playlists:', error);
    return NextResponse.json({ error: 'Failed to search playlists' }, { status: 500 });
  }
}
