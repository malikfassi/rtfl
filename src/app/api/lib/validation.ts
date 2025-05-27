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

// Lyrics schemas
export const maskTextSchema = z.string()
  .min(1, 'Text to mask is required');

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

export const guessRequestSchema = z.object({
  guess: z.string().trim().min(1, 'Guess is required')
}).strict();

// Genius schemas
export const geniusArtistSchema = z.object({
  id: z.number(),
  name: z.string(),
  url: z.string(),
  image_url: z.string(),
  api_path: z.string().optional(),
  header_image_url: z.string().optional(),
  is_meme_verified: z.boolean().optional(),
  is_verified: z.boolean().optional(),
  iq: z.number().optional()
});

export const geniusResultSchema = z.object({
  id: z.number(),
  title: z.string(),
  url: z.string().optional(),
  path: z.string().optional(),
  header_image_thumbnail_url: z.string().optional(),
  header_image_url: z.string().optional(),
  primary_artist: geniusArtistSchema.optional(),
  annotation_count: z.number().optional(),
  api_path: z.string().optional(),
  artist_names: z.string().optional(),
  full_title: z.string().optional(),
  lyrics_owner_id: z.number().optional(),
  lyrics_state: z.string().optional(),
  primary_artist_names: z.string().optional(),
  pyongs_count: z.union([z.number(), z.null()]).optional(),
  relationships_index_url: z.string().optional(),
  release_date_components: z.union([
    z.object({
      year: z.number(),
      month: z.union([z.number(), z.null()]).optional(),
      day: z.union([z.number(), z.null()]).optional()
    }),
    z.null()
  ]).optional(),
  release_date_for_display: z.union([z.string(), z.null()]).optional(),
  release_date_with_abbreviated_month_for_display: z.union([z.string(), z.null()]).optional(),
  song_art_image_thumbnail_url: z.string().optional(),
  song_art_image_url: z.string().optional(),
  stats: z.object({
    unreviewed_annotations: z.number().optional(),
    hot: z.boolean().optional(),
    pageviews: z.number().optional(),
    concurrents: z.number().optional()
  }).optional(),
  title_with_featured: z.string().optional(),
  featured_artists: z.array(z.unknown()).optional(),
  primary_artists: z.array(z.unknown()).optional()
});

export const geniusHitSchema = z.object({
  highlights: z.array(z.unknown()).optional(),
  index: z.string().optional(),
  type: z.string().optional(),
  result: geniusResultSchema
});

export const geniusSearchResponseSchema = z.object({
  meta: z.object({
    status: z.number()
  }),
  response: z.object({
    hits: z.array(geniusHitSchema)
  })
});

// Export commonly used schemas
export const schemas = {
  date: dateSchema,
  month: monthSchema,
  spotifyId: spotifyIdSchema,
  playlistId: playlistIdSchema,
  searchQuery: searchQuerySchema,
  createGame: createGameRequestSchema,
  submitGuess: submitGuessSchema,
  searchSong: searchSongSchema,
  maskText: maskTextSchema,
  guessRequest: guessRequestSchema,
  genius: {
    searchResponse: geniusSearchResponseSchema,
    hit: geniusHitSchema,
    result: geniusResultSchema
  }
} as const; 