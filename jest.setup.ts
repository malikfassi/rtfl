import { setupTestDb, cleanupTestDb } from './src/lib/db/test';

beforeAll(async () => {
  // Set up the test database and run migrations
  await setupTestDb();
}, 30000);

afterAll(async () => {
  // Clean up test database
  await cleanupTestDb();
}); 