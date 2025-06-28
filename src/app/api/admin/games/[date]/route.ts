import { NextResponse } from 'next/server';
import { handleError } from '@/app/api/lib/utils/error-handler';
import { createGameService } from '@/app/api/lib/services/game';
import { createSongService } from '@/app/api/lib/services/song';
import { schemas, validateSchema, validateJsonBody } from '@/app/api/lib/validation';
import { PrismaClient } from '@prisma/client';
import type { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ date: string }> }
) {
  const prisma = new PrismaClient();
  try {
    const { params } = context;
    const { date } = await params;
    const validatedDate = validateSchema(schemas.date, date);
    
    const songService = createSongService(prisma);
    const gameService = createGameService(songService, prisma);
    const game = await gameService.getByDate(validatedDate);
    
    return NextResponse.json(game);
  } catch (error) {
    return handleError(error);
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ date: string }> }
) {
  const prisma = new PrismaClient();
  try {
    const { params } = context;
    const { date } = await params;
    const validatedDate = validateSchema(schemas.date, date);
    const validatedBody = await validateJsonBody(request, schemas.adminGameUpdate);

    const songService = createSongService(prisma);
    const gameService = createGameService(songService, prisma);

    const song = await songService.create(validatedBody.spotifyId);
    const game = await gameService.createOrUpdate(validatedDate, song.id);
    return NextResponse.json(game);
  } catch (error) {
    return handleError(error);
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ date: string }> }
) {
  const prisma = new PrismaClient();
  try {
    const { params } = context;
    const { date } = await params;
    const validatedDate = validateSchema(schemas.date, date);
    
    const songService = createSongService(prisma);
    const gameService = createGameService(songService, prisma);
    await gameService.delete(validatedDate);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  } finally {
    await prisma.$disconnect();
  }
}

export const dynamic = 'force-dynamic'; 