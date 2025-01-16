import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { join } from 'path';
import { URL } from 'url';

const prisma = new PrismaClient();

const prismaBinary = join('node_modules', '.bin', 'prisma');

beforeAll(async () => {
  // Generate unique database URL for the test
  const url = new URL(process.env.DATABASE_URL || 'file:./test.db');
  url.pathname = `test_${Date.now()}.db`;
  process.env.DATABASE_URL = url.toString();

  // Run migrations
  execSync(`${prismaBinary} migrate deploy`, {
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL,
    },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean up the database before each test
  const tables = ['Game', 'Song'];
  for (const table of tables) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${table}";`);
  }
}); 