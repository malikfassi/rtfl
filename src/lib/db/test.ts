import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { unlinkSync } from 'fs';
import { join } from 'path';

// Set test database URL and path
const TEST_DB_PATH = join(process.cwd(), 'prisma', 'test.db');
const TEST_DB_URL = `file:${TEST_DB_PATH}`;

// Create a new PrismaClient instance for tests
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: TEST_DB_URL,
    },
  },
});

// Function to run migrations on the test database
export async function setupTestDb() {
  // Store original DATABASE_URL
  const originalUrl = process.env.DATABASE_URL;
  
  try {
    // Delete existing test database if it exists
    try {
      unlinkSync(TEST_DB_PATH);
    } catch (error) {
      // Ignore error if file doesn't exist
    }

    // Set DATABASE_URL to test database
    process.env.DATABASE_URL = TEST_DB_URL;

    // Run migrations on test database with retries
    let retries = 3;
    while (retries > 0) {
      try {
        execSync('npx prisma migrate reset --force --skip-seed', { 
          env: {
            ...process.env,
            DATABASE_URL: TEST_DB_URL
          },
          stdio: 'ignore'
        });
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw error;
        }
        // Wait 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    await prisma.$connect();
  } finally {
    // Restore original DATABASE_URL
    if (originalUrl) {
      process.env.DATABASE_URL = originalUrl;
    }
  }
}

// Clean up function to be called after tests
export async function cleanupTestDb() {
  try {
    await prisma.$disconnect();
    try {
      unlinkSync(TEST_DB_PATH);
    } catch (error) {
      // Ignore error if file doesn't exist
    }
  } catch (error) {
    console.error('Error disconnecting from test database:', error);
  }
} 