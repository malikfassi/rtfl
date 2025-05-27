import { SpotifyMocks } from './spotify';
import { GeniusMocks } from './genius';

export { SpotifyMocks } from './spotify';
export { GeniusMocks } from './genius';

// Helper to create all mocks at once
export function createMocks() {
  return {
    spotifyClient: SpotifyMocks.createClient(),
    geniusClient: GeniusMocks.createClient()
  };
} 