import { NextResponse } from 'next/server';
import { handleError } from '@/app/api/lib/utils/error-handler';
import { createGameStateService } from '@/app/api/lib/services/game-state';
import { validateSchema, schemas } from '@/app/api/lib/validation';
import { requirePlayerId } from '@/app/api/lib/utils/request';
import type { NextRequest } from 'next/server';

export const GET = async (request: NextRequest, context: { params: Promise<{ month: string }> }) => {
  try {
    const { params } = context;
    const { month } = await params;
    const validatedMonth = validateSchema(schemas.month, month);
    const userId = requirePlayerId(request);
    // createGameStateService defaults to the shared client in lib/db. This
    // route used to build a PrismaClient per request and never disconnect it,
    // the only route in the app that did - the archive page polls this
    // endpoint, so the connections piled up until requests started failing.
    const gameStateService = createGameStateService();
    const result = await gameStateService.getGameStatesByMonth(validatedMonth, userId);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}; 