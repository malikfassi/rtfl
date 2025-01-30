import { NextResponse } from 'next/server';
import { Handler } from 'typed-route-handler';
import { handleError } from '@/app/api/lib/utils/error-handler';
import { guessService } from '@/app/api/lib/services/guess';
import { gameStateService } from '@/app/api/lib/services/game-state';
import { validateSchema, schemas, validateJsonBody } from '@/app/api/lib/validation';
import type { GameState } from '@/app/api/lib/types/game-state';

type ErrorResponse = { error: string };
type SuccessResponse<T> = T;
type PostResponse = SuccessResponse<GameState> | ErrorResponse;

export const POST: Handler<PostResponse> = async (request, { params }) => {
  try {
    const { date } = await params;
    const validatedDate = validateSchema(schemas.date, date);
    const userId = request.headers.get('x-user-id')!; // Safe because of middleware
    
    const { guess } = await validateJsonBody(request, schemas.guessRequest);

    // Submit the guess
    await guessService.submitGuess({
      date: validatedDate,
      userId,
      guess
    });

    // Get the updated game state
    const gameState = await gameStateService.getGameState(validatedDate, userId);
    return NextResponse.json(gameState);
  } catch (error) {
    return handleError(error);
  }
}; 