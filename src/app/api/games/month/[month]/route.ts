import { NextResponse } from 'next/server';
import { handleError } from '@/app/api/lib/utils/error-handler';
import { createGameStateService } from '@/app/api/lib/services/game-state';
import { validateSchema, schemas } from '@/app/api/lib/validation';
import { requirePlayerId } from '@/app/api/lib/utils/request';
import { PrismaClient } from '@prisma/client';
import type { NextRequest } from 'next/server';

export const GET = async (request: NextRequest, context: { params: Promise<{ month: string }> }) => {
  // A client per request, like every other route. The integration tests point
  // a route at their own database by setting DATABASE_URL before calling it,
  // which only works because the client is built here rather than imported
  // from lib/db at module load.
  const prisma = new PrismaClient();
  try {
    const { params } = context;
    const { month } = await params;
    const validatedMonth = validateSchema(schemas.month, month);
    const userId = requirePlayerId(request);
    const gameStateService = createGameStateService(prisma);
    const result = await gameStateService.getGameStatesByMonth(validatedMonth, userId);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  } finally {
    // This route had no finally at all, and the archive page polls it - the
    // connections piled up until requests started failing.
    await prisma.$disconnect();
  }
};
