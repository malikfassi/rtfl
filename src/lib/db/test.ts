import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

// Set test database URL
const TEST_DB_URL = 'file:./test.db';

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
    // Run migrations on test database
    execSync('prisma migrate deploy', { 
      env: {
        ...process.env,
        DATABASE_URL: TEST_DB_URL
      }
    });
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
  await prisma.game.deleteMany();
  await prisma.song.deleteMany();
  await prisma.$disconnect();
} 