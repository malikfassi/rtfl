import { z } from 'zod';
import { ValidationError } from './errors/base';

/**
 * Validates data against a Zod schema and throws a ValidationError if invalid
 * @throws {ValidationError} If validation fails
 */
export function validateSchema<T>(schema: z.Schema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.errors[0].message);
    }
    throw error;
  }
}

/**
 * Common validation schemas used across routes
 */
export const schemas = {
  // Date formats
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Invalid month format'),
  
  // IDs and references
  spotifyId: z.string().min(1, 'Spotify ID is required'),
  playlistId: z.string().min(1, 'Playlist ID is required'),
  
  // Search queries
  searchQuery: z.string().min(1, 'Search query is required'),
  
  // Request bodies
  createGame: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    spotifyId: z.string().min(1, 'Spotify ID is required')
  })
} as const;

/**
 * Helper to validate request search params
 * @throws {ValidationError} If required param is missing or invalid
 */
export function validateSearchParam(params: URLSearchParams, key: string, schema: z.Schema): string {
  const value = params.get(key);
  if (!value) {
    throw new ValidationError(`Missing required parameter: ${key}`);
  }
  return validateSchema(schema, value);
}

/**
 * Helper to validate and parse JSON request body
 * @throws {ValidationError} If body is missing or invalid JSON
 */
export async function validateJsonBody<T>(req: Request, schema: z.Schema<T>): Promise<T> {
  try {
    const body = await req.json();
    return validateSchema(schema, body);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError('Invalid JSON in request body');
  }
} 