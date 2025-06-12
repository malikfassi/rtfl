import { NextResponse } from 'next/server';
import { handleError } from '@/app/api/lib/utils/error-handler';
import { GuessService } from '@/app/api/lib/services/guess';
import { GameStateService } from '@/app/api/lib/services/game-state';
import { validateSchema, schemas } from '@/app/api/lib/validation';
import { PrismaClient } from '@prisma/client';

export async function POST(request: Request, { params }: { params: Promise<{ date: string }> }) {
  try {
    const { date } = await params;
    let validatedDate: string;
    
    // Handle rickroll case
    if (date === 'rickroll') {
      validatedDate = '2099-12-31'; // Use the special rickroll date
    } else {
      validatedDate = validateSchema(schemas.date, date);
    }
    
    const userId = request.headers.get('x-user-id')!;
    
    const body = await request.json();
    validateSchema(schemas.guessRequest, body);

    // Create Prisma client inside the handler to use the correct DATABASE_URL
    const prisma = new PrismaClient();
    const guessService = new GuessService(prisma);
    const gameStateService = new GameStateService(prisma);

    // Submit guess and get response
    const guessResponse = await guessService.submitGuess({ date: validatedDate, userId, guess: body.guess });

    // For rickroll, we don't need to fetch updated game state since guesses aren't stored
    if (date === 'rickroll') {
      await prisma.$disconnect();
      return NextResponse.json({
        ...await gameStateService.getGameState(validatedDate, userId),
        guesses: [guessResponse] // Include the temporary guess in the response
      });
    }

    // For regular games, fetch and return the updated game state
    const updatedGameState = await gameStateService.getGameState(validatedDate, userId);
    await prisma.$disconnect();
    return NextResponse.json(updatedGameState);
  } catch (error) {
    return handleError(error);
  }
} 