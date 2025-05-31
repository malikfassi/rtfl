import { SpotifyMocks } from './spotify';
import { GeniusMocks } from './genius';
import { LyricsMocks } from './lyrics';

export { SpotifyMocks } from './spotify';
export { GeniusMocks } from './genius';
export { LyricsMocks } from './lyrics';

// Helper to create all mocks at once
export function createMocks() {
  return {
    spotifyClient: SpotifyMocks.createClient(),
    geniusClient: GeniusMocks.createClient(),
    lyricsClient: LyricsMocks.createClient()
  };
} 