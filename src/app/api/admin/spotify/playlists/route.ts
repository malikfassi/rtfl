import { NextRequest, NextResponse } from 'next/server';
import { spotifyClient } from '@/lib/clients/spotify';

export async function GET(_request: NextRequest) {
  try {
    const playlists = await spotifyClient.getUserPlaylists();
    return NextResponse.json(playlists);
  } catch (error) {
    console.error('Failed to fetch playlists:', error);
    return NextResponse.json(
      { error: 'SPOTIFY_ERROR', message: 'Failed to fetch playlists' },
      { status: 500 }
    );
  }
} 