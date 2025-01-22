/**
 * Main test utilities module.
 * Provides access to test data, setup/cleanup functions, and utilities.
 */

// Export test environment setup/cleanup
export {
  setupIntegrationTest,
  cleanupIntegrationTest,
  type IntegrationTestContext
} from './test-env/integration';

export {
  setupUnitTest,
  cleanupUnitTest,
  type UnitTestContext
} from './test-env/unit';

export {
  setupTestDb,
  cleanupTestDb
} from './test-env/db';

// Export test data and types
export {
  spotifyData,
  geniusData,
  getLyrics,
  getMaskedLyrics,
  getMaskedTitle,
  getMaskedArtist,
  lyricsJson,
  type GeniusSearchResponse,
  type GeniusSearchResult,
  type Track,
  type SimplifiedPlaylist,
  type LyricsFixture,
  type LyricsJson
} from './fixtures';

// Export mocks
export { SpotifyClientMock } from './mocks/spotify';
export { GeniusClientMock } from './mocks/genius'; 