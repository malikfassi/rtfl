import { NextRequest, NextResponse } from 'next/server';
import { getSpotifyApi } from '@/lib/spotify/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 });
    }

    const spotifyApi = await getSpotifyApi();
    const playlist = await spotifyApi.playlists.getPlaylist(id);
    const tracks = await spotifyApi.playlists.getPlaylistItems(id);

    return NextResponse.json(
      {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        owner: {
          id: playlist.owner.id,
          name: playlist.owner.display_name,
        },
        images: playlist.images,
        tracks: tracks.items
          .filter((item) => item.track?.type === 'track')
          .map((item) => ({
            id: item.track.id,
            name: item.track.name,
            artist: item.track.artists[0]?.name || 'Unknown Artist',
            previewUrl: item.track.preview_url,
            albumCover: item.track.album.images[0]?.url || '',
          })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Failed to get playlist:', error);
    return NextResponse.json({ error: 'Failed to get playlist' }, { status: 500 });
  }
}
