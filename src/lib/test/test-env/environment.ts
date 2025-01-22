/**
 * Global test environment configuration.
 * This file sets up the test environment for both unit and integration tests.
 */

import { config } from 'dotenv';
import { cleanupTestDb, prisma, setupTestDb, resetTestDb } from './db';

// Load environment variables
config();

// Extend Jest's timeout for database operations
jest.setTimeout(30000);

/**
 * Global setup - runs once before all test files
 * - Sets up in-memory SQLite database
 * - Pushes latest schema
 * - Connects Prisma client
 */
beforeAll(async () => {
  await setupTestDb();
});

/**
 * Global cleanup - runs once after all test files
 * - Disconnects Prisma client
 * - Cleans up test database
 */
afterAll(async () => {
  await cleanupTestDb();
});

/**
 * Per-test setup - runs before each test
 * - Clears all tables while maintaining schema
 * - Handles foreign key constraints
 */
beforeEach(async () => {
  await resetTestDb();
});

// Export configured test database client
export { prisma }; 