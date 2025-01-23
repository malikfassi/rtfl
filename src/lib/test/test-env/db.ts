import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

// Test database configuration
const isIntegrationTest = process.env.JEST_PROJECT_NAME === 'integration';
const dbFileName = `test-${process.env.JEST_WORKER_ID || '1'}.db`;
const dbFilePath = path.join(process.cwd(), 'prisma', dbFileName);

// Always use file database for tests
export const TEST_DB_URL = `file:${dbFilePath}`;

// Set DATABASE_URL for Prisma
process.env.DATABASE_URL = TEST_DB_URL;

// Create test-specific Prisma client
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: TEST_DB_URL
    }
  },
  log: ['error'] // Disable logging in tests
});

// Initialize test database
export async function setupTestDb() {
  try {
    // Disconnect any existing connections
    await prisma.$disconnect();

    // Ensure the prisma directory exists
    const prismaDir = path.join(process.cwd(), 'prisma');
    if (!fs.existsSync(prismaDir)) {
      fs.mkdirSync(prismaDir);
    }
    
    // Remove existing test database if it exists
    if (fs.existsSync(dbFilePath)) {
      fs.unlinkSync(dbFilePath);
    }

    // Create an empty database file
    fs.writeFileSync(dbFilePath, '');

    // Set up test database using db push with force-reset to ensure clean state
    try {
      const output = execSync('npx prisma db push --schema=prisma/schema.prisma --skip-generate --accept-data-loss --force-reset', {
        env: {
          ...process.env,
          DATABASE_URL: TEST_DB_URL,
        },
      });
      console.log('Prisma db push output:', output.toString());
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Failed to push database schema:', error.message);
      } else {
        console.error('Failed to push database schema:', String(error));
      }
      throw error;
    }

    // Initialize Prisma client with the test database
    await prisma.$connect();

    // Get all tables
    const tables = await prisma.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%' 
      AND name NOT LIKE '_prisma_%';
    `;

    console.log('Created tables:', tables);

    // Verify required tables exist
    const requiredTables = ['song', 'game', 'guess'];
    const missingTables = requiredTables.filter(
      table => !tables.some(t => t.name.toLowerCase() === table)
    );

    if (missingTables.length > 0) {
      throw new Error(`Missing required tables: ${missingTables.join(', ')}`);
    }
  } catch (error) {
    console.error('❌ Failed to set up test database:', error);
    throw error;
  }
}

// Cleanup test database
export async function cleanupTestDb() {
  try {
    await prisma.$disconnect();
    
    // Clean up integration test database file
    if (isIntegrationTest && fs.existsSync(dbFilePath)) {
      fs.unlinkSync(dbFilePath);
    }
  } catch (error) {
    console.error('Failed to cleanup test database:', error);
  }
}

/**
 * Reset test database by deleting all records
 */
export async function resetTestDb() {
  try {
    // Use transaction to ensure atomic cleanup
    await prisma.$transaction(async (tx) => {
      // Disable foreign key checks
      await tx.$executeRawUnsafe('PRAGMA foreign_keys = OFF;');

      // Get all table names
      const tables = await tx.$queryRaw<Array<{ name: string }>>`
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        AND name NOT LIKE 'sqlite_%' 
        AND name NOT LIKE '_prisma_%';
      `;

      // Clear all tables
      for (const { name } of tables) {
        await tx.$executeRawUnsafe(`DELETE FROM "${name}";`);
      }

      // Re-enable foreign key checks
      await tx.$executeRawUnsafe('PRAGMA foreign_keys = ON;');
    });
  } catch (error) {
    console.error('Failed to reset test database:', error);
    throw error;
  }
} 