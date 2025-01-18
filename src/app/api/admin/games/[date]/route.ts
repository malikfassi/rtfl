import { createGameService } from '@/lib/services/game';
import { createSongService } from '@/lib/services/song';

export async function GET(
  req: Request,
  context: { params: { date: string } }
) {
  const { date } = context.params;
  const songService = createSongService();
  const gameService = createGameService(songService);

  try {
    const game = await gameService.getByDate(date);
    return Response.json(game);
  } catch (error) {
    console.error('Failed to get game:', error);
    return Response.json({ error: 'Failed to get game' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: { params: { date: string } }
) {
  const { date } = context.params;
  const body = await req.json();
  const { spotifyId, title, artist } = body;

  if (!date || !spotifyId || !title || !artist) {
    return Response.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const songService = createSongService();
  const gameService = createGameService(songService);

  try {
    const game = await gameService.createOrUpdate(spotifyId, date);
    return Response.json(game);
  } catch (error) {
    console.error('Failed to create/update game:', error);
    return Response.json(
      { error: 'Failed to create/update game' },
      { status: 500 }
    );
  }
} 