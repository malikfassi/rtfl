import type { NextRequest } from 'next/server';

import { ValidationError } from '@/app/api/lib/errors/base';

/**
 * Reads the player id every game route needs.
 *
 * Nothing supplies this header automatically - src/middleware.ts sets a player
 * cookie but its matcher excludes /api entirely - so a caller that forgets it
 * is a real case, not an impossible one. Routes used to reach for it with a
 * non-null assertion, which let `null` through to the schema check downstream
 * and surfaced as a bare "Validation error" that named nothing.
 */
export function requirePlayerId(request: NextRequest | Request): string {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    throw new ValidationError('x-user-id header is required');
  }
  return userId;
}
