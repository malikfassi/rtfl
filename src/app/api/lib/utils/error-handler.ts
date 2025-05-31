import { NextResponse } from 'next/server';
import { AppError } from '@/app/api/lib/errors/base';
import { ErrorCode } from '@/app/api/lib/errors/codes';
import { ErrorMessage } from '@/app/api/lib/errors/messages';

export async function handleError(error: unknown) {
  console.error('Route error:', error);

  // Log validation context if present
  if (error instanceof Error && 'context' in error && (error as any).context) {
    console.error('Validation context:', (error as any).context);
  }

  if (error instanceof AppError) {
    return NextResponse.json(error.toJSON(), { status: error.status });
  }

  return NextResponse.json(
    { 
      error: ErrorCode.InternalError,
      message: ErrorMessage[ErrorCode.InternalError] as string
    },
    { status: 500 }
  );
} 