import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import { ValidationError } from '@/app/api/lib/errors/base';
import { handleError } from '@/app/api/lib/utils/error-handler';
import { createGameService } from '@/app/api/lib/services/game';
import type { GameWithSong } from '@/app/types';
import { schemas, validateSchema } from '@/app/api/lib/validation';
import { createSongService } from '@/app/api/lib/services/song';

type ErrorResponse = { error: string };
type SuccessResponse<T> = T;

type GetResponse = SuccessResponse<GameWithSong | GameWithSong[]> | ErrorResponse;
type PostResponse = SuccessResponse<GameWithSong> | ErrorResponse;
type DeleteResponse = SuccessResponse<{ success: boolean }> | ErrorResponse;

export async function GET(request: Request): Promise<NextResponse<GetResponse>> {
  const prisma = new PrismaClient();
  try {
    const songService = createSongService(prisma);
    const gameService = createGameService(songService, prisma);
    
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const date = searchParams.get('date');

    if (!date && !month) {
      throw new ValidationError();
    }

    if (date) {
      const validatedDate = validateSchema(schemas.date, date);
      const result = await gameService.getByDate(validatedDate);
      return NextResponse.json(result);
    } else {
      const validatedMonth = validateSchema(schemas.month, month);
      const result = await gameService.getByMonth(validatedMonth);
      return NextResponse.json(result);
    }
  } catch (error) {
    return handleError(error);
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request): Promise<NextResponse<PostResponse>> {
  const prisma = new PrismaClient();
  try {
    const songService = createSongService(prisma);
    const gameService = createGameService(songService, prisma);
    
    const body = await request.json();
    const { date, spotifyId } = body;
    
    if (!date) {
      throw new ValidationError();
    }
    if (!spotifyId) {
      throw new ValidationError();
    }

    const validatedDate = validateSchema(schemas.date, date);
    const validatedSpotifyId = validateSchema(schemas.spotifyId, spotifyId);
    
    const song = await songService.create(validatedSpotifyId);
    const result = await gameService.createOrUpdate(validatedDate, song.id);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: Request): Promise<NextResponse<DeleteResponse>> {
  const prisma = new PrismaClient();
  try {
    const songService = createSongService(prisma);
    const gameService = createGameService(songService, prisma);
    
    const body = await request.json();
    const { date } = body;
    
    if (!date) {
      throw new ValidationError();
    }

    const validatedDate = validateSchema(schemas.date, date);
    await gameService.delete(validatedDate);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  } finally {
    await prisma.$disconnect();
  }
}