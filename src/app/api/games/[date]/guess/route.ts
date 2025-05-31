import { NextResponse } from 'next/server';
import { Handler } from 'typed-route-handler';
import { handleError } from '@/app/api/lib/utils/error-handler';
import { createGuessService } from '@/app/api/lib/services/guess';
import { createGameStateService } from '@/app/api/lib/services/game-state';
import { validateSchema, schemas, validateJsonBody } from '@/app/api/lib/validation';
import type { GameState } from '@/app/api/lib/types/game-state';
import { PrismaClient } from '@prisma/client';
import type { NextRequest } from 'next/server';

type ErrorResponse = { error: string };
type SuccessResponse<T> = T;
type PostResponse = SuccessResponse<GameState> | ErrorResponse;

export const POST = (prisma: PrismaClient) =>
  async (request: NextRequest, { params }: { params: { date: string } }) => {
    try {
      const { date } = params;
      const validatedDate = validateSchema(schemas.date, date);
      const userId = request.headers.get('x-user-id')!;
      
      const body = await request.json();
      validateSchema(schemas.guessRequest, body);

      // Use dependency injection for the service
      const guessService = createGuessService(prisma);
      await guessService.submitGuess({ date: validatedDate, userId, guess: body.guess });

      // Fetch and return the updated game state
      const gameStateService = createGameStateService(prisma);
      const updatedGameState = await gameStateService.getGameState(validatedDate, userId);
      return NextResponse.json(updatedGameState);
    } catch (error) {
      return handleError(error);
    }
  }; 