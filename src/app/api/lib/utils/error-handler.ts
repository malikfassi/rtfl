import { NextResponse } from 'next/server';
import { AppError } from '@/app/api/lib/errors/base';
import { ErrorCode } from '@/app/api/lib/errors/codes';
import { ErrorMessage } from '@/app/api/lib/errors/messages';

interface ErrorWithContext extends Error {
  context?: unknown;
}

export async function handleError(error: unknown) {
  // Logging must never be able to take the response down with it. This runs
  // inside every route's catch, so if it throws, the catch rejects, nothing
  // returns a response, and Next answers with an empty-bodied 500 - which
  // reaches the client as "Unexpected end of JSON input", naming neither the
  // route nor the real error. Next's dev console is patched and has been seen
  // throwing while serialising what it is handed.
  try {
    console.error('Route error:', error || 'Unknown error');

    // Log validation context if present
    if (error instanceof Error && 'context' in error && (error as ErrorWithContext).context) {
      console.error('Validation context:', (error as ErrorWithContext).context);
    }
  } catch {
    // A broken logger must not become a broken response.
  }

  // toJSON() is the error's own code, so it gets the same treatment.
  try {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
  } catch {
    // Fall through to the generic 500 below.
  }

  return NextResponse.json(
    {
      error: ErrorCode.InternalError,
      message: ErrorMessage[ErrorCode.InternalError] as string
    },
    { status: 500 }
  );
}