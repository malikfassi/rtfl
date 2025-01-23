import { z } from 'zod';
import { ValidationError } from './errors/base';

/**
 * Validates data against a Zod schema and throws a ValidationError if invalid
 * @throws {ValidationError} If validation fails
 */
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
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
  spotifyId: z.string()
    .min(1, 'Spotify ID is required')
    .regex(/^[0-9A-Za-z]{22}$/, 'Invalid Spotify track ID format'),
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

// Common schemas
export const spotifyIdSchema = z.string().trim()
  .min(1, 'Spotify ID is required')
  .transform((val) => {
    // If it's a Spotify URI, extract the ID
    if (val.startsWith('spotify:track:')) {
      return val.split(':')[2];
    }
    return val;
  })
  .refine((val) => /^[a-zA-Z0-9]{22}$/.test(val), 'Invalid Spotify track ID format');

export const searchQuerySchema = z.string().trim()
  .min(1, 'Search query is required');

// Game schemas
export const gameDateSchema = z.string().trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD')
  .refine((date) => !isNaN(Date.parse(date)), 'Invalid date');

export const gameMonthSchema = z.string().trim()
  .regex(/^\d{4}-\d{2}$/, 'Invalid month format. Expected YYYY-MM')
  .refine((month) => {
    const monthNum = parseInt(month.split('-')[1], 10);
    return monthNum >= 1 && monthNum <= 12;
  }, 'Invalid month');

// Guess schemas
export const gameIdSchema = z.string().trim()
  .min(1, 'Game ID is required')
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid game ID format');

export const playerIdSchema = z.string().trim()
  .min(1, 'Player ID is required')
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid player ID format');

export const wordSchema = z.string().trim()
  .min(1, 'Word is required')
  .regex(/^[a-zA-ZÀ-ÿ]+$/, 'Word must contain only letters');

// Song schemas
export const songTitleSchema = z.string().trim()
  .min(1, 'Song title is required');

export const artistNameSchema = z.string().trim()
  .min(1, 'Artist name is required');

// Request schemas
export const createGameSchema = z.object({
  date: gameDateSchema,
  trackId: spotifyIdSchema
});

export const submitGuessSchema = z.object({
  gameId: gameIdSchema,
  playerId: playerIdSchema,
  word: wordSchema
});

export const searchSongSchema = z.object({
  title: songTitleSchema,
  artist: artistNameSchema
}); 