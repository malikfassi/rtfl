import { NextResponse } from 'next/server';
import { handleError } from '@/app/api/lib/utils/error-handler';
import { guessService } from '@/app/api/lib/services/guess';
import { gameStateService } from '@/app/api/lib/services/game-state';
import { validateSchema, schemas } from '@/app/api/lib/validation';

export async function POST(request: Request, { params }: { params: Promise<{ date: string }> }) {
  try {
    const { date } = await params;
    const validatedDate = validateSchema(schemas.date, date);
    const userId = request.headers.get('x-user-id')!;
    
    const body = await request.json();
    validateSchema(schemas.guessRequest, body);

    await guessService.submitGuess({ date: validatedDate, userId, guess: body.guess });

    // Fetch and return the updated game state
    const updatedGameState = await gameStateService.getGameState(validatedDate, userId);
    return NextResponse.json(updatedGameState);
  } catch (error) {
    return handleError(error);
  }
} 