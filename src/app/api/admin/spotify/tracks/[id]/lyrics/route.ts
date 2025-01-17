import { createSongService } from '@/lib/services/song';
import { spotifyClient } from '@/lib/clients/spotify';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // First get track details from Spotify
    const track = await spotifyClient.getTrack(params.id);
    if (!track) {
      return Response.json(
        { error: 'NOT_FOUND', message: 'Track not found on Spotify' },
        { status: 404 }
      );
    }

    // Then get or create song with lyrics
    const songService = createSongService();
    const song = await songService.getOrCreate(
      track.spotifyId,
      track.title,
      track.artist
    );
    
    return Response.json({
      lyrics: song.lyrics,
      maskedLyrics: song.maskedLyrics
    });
  } catch (error) {
    console.error('Failed to fetch lyrics:', error);
    return Response.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch lyrics' },
      { status: 500 }
    );
  }
} 