import { NextResponse } from 'next/server';
import { Handler } from 'typed-route-handler';
import { handleError } from '@/app/api/lib/utils/error-handler';
import { createGameStateService } from '@/app/api/lib/services/game-state';
import { validateSchema, schemas } from '@/app/api/lib/validation';
import type { GameState } from '@/app/api/lib/types/game-state';
import { PrismaClient } from '@prisma/client';
import type { NextRequest } from 'next/server';

type ErrorResponse = { error: string };
type SuccessResponse<T> = T;
type GetResponse = SuccessResponse<GameState> | ErrorResponse;

export const GET = (prisma: PrismaClient) =>
  async (request: NextRequest, { params }: { params: { date: string } }) => {
    try {
      const { date } = params;
      const validatedDate = validateSchema(schemas.date, date);
      const userId = request.headers.get('x-user-id')!;
      const gameStateService = createGameStateService(prisma);
      const result = await gameStateService.getGameState(validatedDate, userId);
      return NextResponse.json(result);
    } catch (error) {
      return handleError(error);
    }
  }; 