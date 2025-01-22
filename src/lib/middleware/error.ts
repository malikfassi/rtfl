import { AppError, ValidationError, InternalError } from '../errors/base';
import { z } from 'zod';
import { NextRequest } from 'next/server';

export type RouteHandler<T = unknown> = (
  req: NextRequest,
  context: T
) => Promise<Response>;

interface ErrorResponse {
  error: string;
  message: string;
  details?: unknown;
}

function logError(error: unknown, req: NextRequest) {
  const errorContext = {
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  };

  if (error instanceof AppError) {
    console.error('Domain error:', {
      ...errorContext,
      code: error.code,
      status: error.status,
      message: error.message
    });
    return;
  }

  if (error instanceof z.ZodError) {
    console.error('Validation error:', {
      ...errorContext,
      errors: error.errors
    });
    return;
  }

  console.error('Unexpected error:', {
    ...errorContext,
    error: error instanceof Error ? error : String(error)
  });
}

function createErrorResponse(error: unknown): { response: ErrorResponse; status: number } {
  // Domain errors
  if (error instanceof AppError) {
    return {
      response: error.toJSON(),
      status: error.status
    };
  }

  // Validation errors
  if (error instanceof z.ZodError) {
    const validationError = new ValidationError(error.errors[0].message);
    return {
      response: validationError.toJSON(),
      status: validationError.status
    };
  }

  // Unknown errors
  const internalError = new InternalError('An unexpected error occurred');
  return {
    response: internalError.toJSON(),
    status: internalError.status
  };
}

export function withErrorHandler<T>(handler: RouteHandler<T>): RouteHandler<T> {
  return async (req: NextRequest, context: T) => {
    try {
      return await handler(req, context);
    } catch (error) {
      // Log error with context
      logError(error, req);

      // Transform and return error response
      const { response, status } = createErrorResponse(error);
      return Response.json(response, { status });
    }
  };
} 