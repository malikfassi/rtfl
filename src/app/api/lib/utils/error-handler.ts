import { NextResponse } from 'next/server';
import { AppError } from '@/app/api/lib/errors/base';
import { ErrorCode } from '@/app/api/lib/errors/codes';
import { ErrorMessage } from '@/app/api/lib/errors/messages';

interface ErrorWithContext extends Error {
  context?: unknown;
}

/**
 * Logs without ever throwing. Next patches console in dev and it has been seen
 * raising ERR_INVALID_ARG_TYPE while serialising what it is handed. Swallowing
 * that silently would only trade a crash for a 500 nobody can diagnose, so fall
 * back to a raw write that serialises nothing itself.
 */
function logSafely(label: string, value: unknown) {
  try {
    console.error(label, value);
    return;
  } catch {
    // fall through to the raw write
  }
  try {
    const detail =
      value instanceof Error ? value.stack ?? `${value.name}: ${value.message}` : String(value);
    process.stderr.write(`${label} ${detail}\n`);
  } catch {
    // nothing left to try
  }
}

export async function handleError(error: unknown) {
  // Logging must never be able to take the response down with it. This runs
  // inside every route's catch, so if it throws, the catch rejects, nothing
  // returns a response, and Next answers with an empty-bodied 500 - which
  // reaches the client as "Unexpected end of JSON input", naming neither the
  // route nor the real error.
  logSafely('Route error:', error || 'Unknown error');

  // Log validation context if present
  if (error instanceof Error && 'context' in error && (error as ErrorWithContext).context) {
    logSafely('Validation context:', (error as ErrorWithContext).context);
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