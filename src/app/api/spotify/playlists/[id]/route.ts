import { NextRequest, NextResponse } from 'next/server';
import { getSpotifyApi } from '@/lib/spotify/auth';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'Playlist ID is required' }, { status: 500 });
    }

    const spotifyApi = await getSpotifyApi();
    const playlist = await spotifyApi.playlists.getPlaylist(id);

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
