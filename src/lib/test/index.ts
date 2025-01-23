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
  TEST_CASES,
  type Track,
  type SimplifiedPlaylist,
  type GeniusSearchResponse,
  type SongKey,
  type PlaylistKey,
  type SongTestCase,
  type PlaylistTestCase,
  validators
} from './fixtures'; 