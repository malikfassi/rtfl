import { setupTestDb, cleanupTestDb } from './src/lib/db/test';

beforeAll(async () => {
  // Set up the test database and run migrations
  await setupTestDb();
});

afterAll(async () => {
  // Clean up and disconnect
  await cleanupTestDb();
}); 