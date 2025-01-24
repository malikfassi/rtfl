/**
 * Global test environment configuration.
 * This file sets up the test environment for both unit and integration tests.
 */

import { config } from 'dotenv';

import { cleanupTestDb, prisma, resetTestDb,setupTestDb } from './db';

// Load environment variables
config();

// Extend Jest's timeout for database operations
jest.setTimeout(30000);

/**
 * Global setup - runs once before all test files
 * Sets up SQLite database and pushes latest schema
 */
beforeAll(async () => {
  await setupTestDb();
});

/**
 * Global cleanup - runs once after all test files
 * Disconnects Prisma client and cleans up database
 */
afterAll(async () => {
  await cleanupTestDb();
});

/**
 * Per-test setup - runs before each test
 * Cleans all tables while maintaining schema
 */
beforeEach(async () => {
  try {
    await resetTestDb();
  } catch (error) {
    console.error('Failed to reset test database:', error);
    throw error;
  }
});

// Export configured test database client
export { prisma }; 