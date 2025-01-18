import { getSpotifyClient } from '@/lib/clients/spotify';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const spotifyClient = getSpotifyClient();
    const tracks = await spotifyClient.getPlaylistTracks(params.id);
    return new Response(JSON.stringify(tracks), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to fetch playlist tracks:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch playlist tracks' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 