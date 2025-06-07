import { NextResponse } from 'next/server';
import { handleError } from '@/app/api/lib/utils/error-handler';
import { createGameService, type GameWithSong } from '@/app/api/lib/services/game';
import { createSongService } from '@/app/api/lib/services/song';
import { schemas, validateSchema } from '@/app/api/lib/validation';
import { PrismaClient } from '@prisma/client';

// These types are used for type checking the response
type ErrorResponse = { error: string };
type SuccessResponse = GameWithSong;
type DeleteResponse = { success: boolean };
type Response = ErrorResponse | SuccessResponse | DeleteResponse;

const prisma = new PrismaClient();

export function makeGET(prisma: PrismaClient) {
  return async function handler(
    request: Request,
    { params }: { params: Promise<{ date: string }> }
  ): Promise<NextResponse<Response>> {
    try {
      const { date } = await params;
      const validatedDate = validateSchema(schemas.date, date);
      const gameService = await createGameService(undefined, prisma);
      const game = await gameService.getByDate(validatedDate);
      return NextResponse.json(game);
    } catch (error) {
      return handleError(error);
    }
  };
}

export function makePOST(prisma: PrismaClient) {
  return async function handler(
    request: Request,
    { params }: { params: Promise<{ date: string }> }
  ): Promise<NextResponse<Response>> {
    try {
      const { date } = await params;
      const validatedDate = validateSchema(schemas.date, date);
      const body = await request.json();
      const spotifyId = validateSchema(schemas.spotifyId, body.spotifyId);

      const [gameService, songService] = await Promise.all([
        createGameService(undefined, prisma),
        createSongService(prisma)
      ]);

      const song = await songService.create(spotifyId);
      const game = await gameService.createOrUpdate(validatedDate, song.id);
      return NextResponse.json(game);
    } catch (error) {
      return handleError(error);
    }
  };
}

export function makeDELETE(prisma: PrismaClient) {
  return async function handler(
    request: Request,
    { params }: { params: Promise<{ date: string }> }
  ): Promise<NextResponse<Response>> {
    try {
      const { date } = await params;
      const validatedDate = validateSchema(schemas.date, date);
      const gameService = await createGameService(undefined, prisma);
      await gameService.delete(validatedDate);
      return NextResponse.json({ success: true });
    } catch (error) {
      return handleError(error);
    }
  };
}

export const GET = makeGET(prisma);
export const POST = makePOST(prisma);
export const DELETE = makeDELETE(prisma);

export const dynamic = 'force-dynamic'; 