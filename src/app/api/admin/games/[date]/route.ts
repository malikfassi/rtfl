import { NextResponse } from 'next/server';
import { handleError } from '@/app/api/lib/utils/error-handler';
import { createGameService, type GameWithSong } from '@/app/api/lib/services/game';
import { createSongService } from '@/app/api/lib/services/song';
import { schemas, validateSchema } from '@/app/api/lib/validation';

// These types are used for type checking the response
type ErrorResponse = { error: string };
type SuccessResponse = GameWithSong;
type DeleteResponse = { success: boolean };
type Response = ErrorResponse | SuccessResponse | DeleteResponse;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ date: string }> }
): Promise<NextResponse<Response>> {
  try {
    const { date } = await params;
    const validatedDate = validateSchema(schemas.date, date);
    const gameService = await createGameService();
    const game = await gameService.getByDate(validatedDate);
    return NextResponse.json(game);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ date: string }> }
): Promise<NextResponse<Response>> {
  try {
    const { date } = await params;
    const validatedDate = validateSchema(schemas.date, date);
    const body = await request.json();
    const spotifyId = validateSchema(schemas.spotifyId, body.spotifyId);
    
    const [gameService, songService] = await Promise.all([
      createGameService(),
      createSongService()
    ]);

    const song = await songService.getTrack(spotifyId);
    const game = await gameService.createOrUpdate(validatedDate, song.id);
    return NextResponse.json(game);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ date: string }> }
): Promise<NextResponse<Response>> {
  try {
    const { date } = await params;
    const validatedDate = validateSchema(schemas.date, date);
    const gameService = await createGameService();
    await gameService.delete(validatedDate);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

export const dynamic = 'force-dynamic'; 