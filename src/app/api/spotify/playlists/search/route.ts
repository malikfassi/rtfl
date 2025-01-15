import { NextRequest, NextResponse } from 'next/server';
import { getSpotifyApi } from '@/lib/spotify/auth';
import { type SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json({ error: 'Invalid search parameters' }, { status: 400 });
    }

    const spotifyApi = await getSpotifyApi();

    // Limit must be one of the specific values allowed by Spotify SDK
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 50) as 20;
    const offset = Number(searchParams.get('offset')) || 0;

    const playlists = await spotifyApi.search(query, ['playlist'], undefined, limit, offset);

    return NextResponse.json(
      {
        items: playlists.playlists.items.map((playlist) => ({
          id: playlist.id,
          name: playlist.name,
          description: playlist.description,
          owner: {
            id: playlist.owner.id,
            name: playlist.owner.display_name,
          },
          images: playlist.images,
          totalTracks: (playlist as SimplifiedPlaylist).tracks?.total ?? 0,
        })),
        total: playlists.playlists.total,
        limit,
        offset,
        next: playlists.playlists.next,
        previous: playlists.playlists.previous,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Failed to search playlists:', error);
    return NextResponse.json({ error: 'Failed to search playlists' }, { status: 500 });
  }
}
