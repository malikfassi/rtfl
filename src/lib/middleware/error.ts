import { AppError, InternalError } from '../errors/base';
import { z } from 'zod';
import { NextRequest } from 'next/server';

export type RouteHandler<T = unknown> = (
  req: NextRequest,
  context: T
) => Promise<Response>;

function logError(error: unknown, req: NextRequest) {
  const errorContext = {
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  };

  if (error instanceof AppError) {
    console.log(`${error.code}:`, {
      ...errorContext,
      status: error.status,
      message: error.message
    });
    return;
  }

  if (error instanceof z.ZodError) {
    console.log('Validation error:', {
      ...errorContext,
      errors: error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }))
    });
    return;
  }

  console.error('Unhandled error:', {
    ...errorContext,
    error: error instanceof Error ? error.stack : String(error)
  });
}

function createErrorResponse(error: unknown): { response: unknown; status: number } {
  // Domain errors (AppError and its subclasses)
  if (error instanceof AppError) {
    return {
      response: {
        error: error.message
      },
      status: error.status
    };
  }

  // Zod validation errors
  if (error instanceof z.ZodError) {
    return {
      response: {
        error: error.errors[0].message
      },
      status: 400
    };
  }

  // Prisma errors
  if (error instanceof Error && error.name === 'PrismaClientKnownRequestError') {
    return {
      response: {
        error: 'A database error occurred'
      },
      status: 500
    };
  }

  // Unknown errors
  const internalError = new InternalError('An unexpected error occurred');
  return {
    response: {
      error: internalError.message
    },
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