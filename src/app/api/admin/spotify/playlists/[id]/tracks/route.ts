import { spotifyClient } from '@/lib/clients/spotify';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = await Promise.resolve(params.id);
    const tracks = await spotifyClient.getPlaylistTracks(id);
    return Response.json(tracks);
  } catch (error) {
    console.error('Failed to fetch playlist tracks:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch playlist tracks' }), 
      { status: 500 }
    );
  }
} 