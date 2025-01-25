import { NextResponse } from 'next/server';
import { Handler } from 'typed-route-handler';
import { handleError } from '@/app/api/lib/utils/error-handler';
import { gameStateService } from '@/app/api/lib/services/game-state';
import { validateSchema, schemas } from '@/app/api/lib/validation';
import { ValidationError } from '@/app/api/lib/errors/base';
import type { GameState } from '@/app/api/lib/types/game';

type ErrorResponse = { error: string };
type SuccessResponse<T> = T;
type GetResponse = SuccessResponse<GameState> | ErrorResponse;

export const GET: Handler<GetResponse> = async (request, { params }) => {
  try {
    const { date } = await params;
    if (!date) {
      throw new ValidationError('Date is required');
    }

    const validatedDate = validateSchema(schemas.date, date);
    const userId = request.headers.get('x-user-id')!; // Safe because of middleware
    const result = await gameStateService.getGameState(validatedDate, userId);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}; 