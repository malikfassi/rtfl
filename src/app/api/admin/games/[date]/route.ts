import { createGameService } from '@/lib/services/game';
import { createSongService } from '@/lib/services/song';

function handleError(error: Error) {
  const status = error.name === 'GameNotFoundError' ? 404 : 400;
  return Response.json({ error: error.message }, { status });
}

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
    return handleError(error as Error);
  }
}

export async function POST(
  req: Request,
  context: { params: { date: string } }
) {
  const { date } = context.params;
  const body = await req.json();
  const { spotifyId } = body;

  if (!date || !spotifyId) {
    return Response.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const songService = createSongService();
  const gameService = createGameService(songService);

  try {
    const game = await gameService.createOrUpdate(date, spotifyId);
    return Response.json(game);
  } catch (error) {
    return handleError(error as Error);
  }
} 