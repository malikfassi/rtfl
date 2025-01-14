import { GeniusAuthError } from '../errors';

let apiKey: string | null = null;

export function getGeniusApiKey(): string {
  if (apiKey) {
    return apiKey;
  }

  const key = process.env.GENIUS_API_KEY;
  if (!key) {
    throw new GeniusAuthError('Missing Genius API key');
  }

  apiKey = key;
  return apiKey;
}

// For testing purposes
export function resetGeniusApiKey(): void {
  apiKey = null;
}
