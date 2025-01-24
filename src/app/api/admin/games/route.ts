import { NextResponse } from 'next/server';
import { Handler } from 'typed-route-handler';

import { ValidationError } from '@/app/api/lib/errors/base';
import { handleError } from '@/app/api/lib/utils/error-handler';
import { gameService, type GameWithSong } from '@/app/api/lib/services/game';
import { schemas, validateSchema } from '@/app/api/lib/validation';

type ErrorResponse = { error: string };
type SuccessResponse<T> = T;

type GetResponse = SuccessResponse<GameWithSong | GameWithSong[]> | ErrorResponse;
type PostResponse = SuccessResponse<GameWithSong> | ErrorResponse;
type DeleteResponse = SuccessResponse<{ success: boolean }> | ErrorResponse;

export const GET: Handler<GetResponse> = async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const date = searchParams.get('date');

    if (!date && !month) {
      throw new ValidationError('Date or month is required');
    }

    if (date) {
      const validatedDate = validateSchema(schemas.date, date);
      const result = await gameService.getByDate(validatedDate);
      return NextResponse.json(result);
    } else {
      const validatedMonth = validateSchema(schemas.month, month);
      const result = await gameService.getByMonth(validatedMonth);
      return NextResponse.json(result);
    }
  } catch (error) {
    return handleError(error);
  }
};

export const POST: Handler<PostResponse> = async (request, { params }) => {
  try {
    const { date } = await params;
    const validatedDate = validateSchema(schemas.date, date);
    const body = await request.json();
    const spotifyId = validateSchema(schemas.spotifyId, body.spotifyId);
    
    const result = await gameService.createOrUpdate(validatedDate, spotifyId);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
};

export const DELETE: Handler<DeleteResponse> = async (request, { params }) => {
  try {
    const { date } = await params;
    const validatedDate = validateSchema(schemas.date, date);
    await gameService.delete(validatedDate);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
};