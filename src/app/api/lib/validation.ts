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
      // Get the first required error or the first error
      const requiredError = error.errors.find(e => e.message === 'Required');
      const firstError = error.errors[0];
      throw new ValidationError(requiredError?.message || firstError.message);
    }
    throw error;
  }
}

// Date schemas
export const dateSchema = z.string()
  .min(1, 'Invalid date format. Expected YYYY-MM-DD')
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD');

export const monthSchema = z.string()
  .min(1, 'Month is required')
  .regex(/^\d{4}-\d{2}$/, 'Invalid month format. Expected YYYY-MM');

// ID schemas
export const spotifyIdSchema = z.string()
  .trim()
  .min(1, 'Spotify ID is required')
  .transform(id => id.replace(/^spotify:track:/, ''))
  .refine(
    id => /^[a-zA-Z0-9]{22}$/.test(id),
    'Invalid Spotify track ID format'
  );

export const playlistIdSchema = z.string()
  .min(1, 'Playlist ID is required');

// Search schemas
export const searchQuerySchema = z.string({
  required_error: 'Expected string, received null',
  invalid_type_error: 'Expected string, received null'
})
  .trim()
  .min(1, 'Search query cannot be empty')
  .max(100, 'String must contain at most 100 character(s)');

// Helper functions
export function validateSearchParam(params: URLSearchParams, key: string, schema: z.Schema): string {
  const value = params.get(key);
  return validateSchema(schema, value);
}

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

// Game schemas
export const gameIdSchema = z.string().trim()
  .min(1, 'Game ID is required')
  .regex(/^[a-z0-9]{25}$/, 'Invalid game ID format');

export const playerIdSchema = z.string().trim()
  .min(1, 'Player ID is required')
  .regex(/^[a-z0-9]{25}$/, 'Invalid player ID format');

export const wordSchema = z.string().trim()
  .min(1, 'Word is required')
  .regex(/^[a-zA-ZÀ-ÿ]+$/, 'Word must contain only letters');

// Song schemas
export const songTitleSchema = z.string().trim()
  .min(1, 'Song title is required');

export const artistNameSchema = z.string().trim()
  .min(1, 'Artist name is required');

// Request schemas
export const createGameRequestSchema = z.object({
  date: dateSchema,
  spotifyId: spotifyIdSchema
}).strict();

export const submitGuessSchema = z.object({
  gameId: gameIdSchema,
  playerId: playerIdSchema,
  word: wordSchema
}).strict();

export const searchSongSchema = z.object({
  title: songTitleSchema,
  artist: artistNameSchema
}).strict();

// Export commonly used schemas
export const schemas = {
  date: dateSchema,
  month: monthSchema,
  spotifyId: spotifyIdSchema,
  playlistId: playlistIdSchema,
  searchQuery: searchQuerySchema,
  createGame: createGameRequestSchema,
  submitGuess: submitGuessSchema,
  searchSong: searchSongSchema
} as const; 