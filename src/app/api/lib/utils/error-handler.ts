import { NextResponse } from 'next/server';
import { AppError } from '@/app/api/lib/errors/base';

export async function handleError(error: unknown) {
  console.error('Route error:', error);

  if (error instanceof AppError) {
    return NextResponse.json(
      { 
        error: error.code,
        message: error.message
      },
      { status: error.status }
    );
  }

  return NextResponse.json(
    { 
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    },
    { status: 500 }
  );
} 