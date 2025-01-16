import { spotifyClient } from '@/lib/clients/spotify';

export async function GET(
  _req: Request,
  context: { params: { id: string } }
): Promise<Response> {
  try {
    const params = await context.params;
    const { id } = params;
    const playlist = await spotifyClient.getPlaylistTracks(id);
    return Response.json(playlist);
  } catch (error) {
    console.error('Failed to get playlist tracks:', error);
    return new Response(JSON.stringify({ error: 'Failed to get playlist tracks' }), {
      status: 500,
    });
  }
} 