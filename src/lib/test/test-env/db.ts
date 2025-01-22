import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

// Test database configuration
export const TEST_DB_URL = 'file:./test.db';

// Create test-specific Prisma client
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: TEST_DB_URL
    }
  }
});

// Initialize test database
export async function setupTestDb() {
  try {
    // Use migrate deploy to set up the test database
    execSync('npx prisma migrate deploy --schema=prisma/schema.prisma', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: TEST_DB_URL }
    });
  } catch (error) {
    console.error('❌ Failed to set up test database:', error);
    throw error;
  }
}

// Cleanup test database
export async function cleanupTestDb() {
  await prisma.$disconnect();
}

// Reset database between tests
export async function resetTestDb() {
  // Get all user-created tables
  const tables = await prisma.$queryRaw<Array<{ name: string }>>`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    AND name NOT LIKE 'sqlite_%' 
    AND name NOT LIKE '_prisma_%'
    ORDER BY name DESC
  `;

  try {
    // Disable foreign key checks during cleanup
    await prisma.$executeRaw`PRAGMA foreign_keys = OFF`;

    // Clear all tables
    for (const { name } of tables) {
      await prisma.$executeRawUnsafe(`DELETE FROM "${name}";`);
    }
  } catch (error) {
    console.error('Failed to reset test database:', error);
    throw error;
  } finally {
    // Re-enable foreign key checks
    await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
  }
}

export { prisma }; 