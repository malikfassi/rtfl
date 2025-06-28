import { NextResponse } from 'next/server';
import { handleError } from '@/app/api/lib/utils/error-handler';
import { createGameStateService } from '@/app/api/lib/services/game-state';
import { validateSchema, schemas } from '@/app/api/lib/validation';
import { PrismaClient } from '@prisma/client';
import type { NextRequest } from 'next/server';

export const GET = async (request: NextRequest, context: { params: Promise<{ month: string }> }) => {
  try {
    const { params } = context;
    const { month } = await params;
    const validatedMonth = validateSchema(schemas.month, month);
    const userId = request.headers.get('x-user-id')!;
    // Instantiate Prisma after env is set
    const prisma = new PrismaClient();
    const gameStateService = createGameStateService(prisma);
    const result = await gameStateService.getGameStatesByMonth(validatedMonth, userId);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}; 