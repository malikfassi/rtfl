import { NextResponse } from 'next/server';
import { Handler } from 'typed-route-handler';
import { handleError } from '@/app/api/lib/utils/error-handler';
import { gameStateService } from '@/app/api/lib/services/game-state';
import { validateSchema, schemas } from '@/app/api/lib/validation';
import type { GameState } from '@/app/api/lib/types/game-state';

type ErrorResponse = { error: string };
type SuccessResponse<T> = T;
type GetResponse = SuccessResponse<GameState> | ErrorResponse;

export const GET: Handler<GetResponse> = async (request, { params }) => {
  try {
    const { date } = await params;

    const validatedDate = validateSchema(schemas.date, date);
    const userId = request.headers.get('x-user-id')!; // Safe because of middleware
    const result = await gameStateService.getGameState(validatedDate, userId);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}; 