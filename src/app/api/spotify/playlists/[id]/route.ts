import { type NextRequest, NextResponse } from 'next/server';
import { getSpotifyApi } from '@/lib/spotify/auth';

type RouteContext = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    if (!params.id) {
      return NextResponse.json({ error: 'Failed to get playlist' }, { status: 500 });
    }

    const spotifyApi = await getSpotifyApi();
    const playlist = await spotifyApi.playlists.getPlaylist(params.id);

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      owner: playlist.owner ? {
        id: playlist.owner.id,
        name: playlist.owner.display_name,
      } : null,
      images: playlist.images || [],
      totalTracks: playlist.tracks?.total || 0,
      tracks: playlist.tracks?.items.map(item => ({
        id: item.track.id,
        name: item.track.name,
        artists: item.track.artists.map(artist => artist.name),
      })) || [],
    });
  } catch (error) {
    console.error('Failed to get playlist:', error);
    return NextResponse.json({ error: 'Failed to get playlist' }, { status: 500 });
  }
}
