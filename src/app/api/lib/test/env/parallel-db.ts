import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

/**
 * Creates a unique database instance for parallel test execution
 */
export class ParallelTestDatabase {
  private prismaClient: PrismaClient | null = null;
  private databaseUrl: string;
  private testId: string;

  constructor() {
    this.testId = randomUUID().substring(0, 8);
    // Get worker ID from Jest (if available)
    const workerId = process.env.JEST_WORKER_ID || '1';
    
    // Create unique database URL based on worker ID and test ID
    const baseUrl = process.env.DATABASE_URL || 'file:./test.db';
    
    if (baseUrl.startsWith('file:')) {
      // Ensure test database directory exists
      const testDbDir = path.join(process.cwd(), 'prisma', 'test-dbs');
      if (!existsSync(testDbDir)) {
        mkdirSync(testDbDir, { recursive: true });
      }
      
      // Create unique database file path
      this.databaseUrl = `file:${testDbDir}/test-worker-${workerId}-${this.testId}.db`;
    } else {
      // For non-SQLite databases, append worker ID to database name
      this.databaseUrl = baseUrl.replace(/\/([^\/]+)$/, `/test_${workerId}_${this.testId}_$1`);
    }
  }

  /**
   * Initialize the database and apply migrations
   */
  async setup(): Promise<PrismaClient> {
    // Set the DATABASE_URL for this specific test
    process.env.DATABASE_URL = this.databaseUrl;

    // Create Prisma client with unique database URL
    this.prismaClient = new PrismaClient({
      datasources: {
        db: {
          url: this.databaseUrl
        }
      },
      log: process.env.DEBUG ? ['query', 'info', 'warn', 'error'] : []
    });

    try {
      // Apply migrations to the test database
      execSync('npx prisma migrate deploy', {
        env: {
          ...process.env,
          DATABASE_URL: this.databaseUrl
        },
        stdio: 'pipe' // Suppress output unless debugging
      });

      // Connect to the database
      await this.prismaClient.$connect();
      
      return this.prismaClient;
    } catch (error) {
      console.error(`Failed to setup test database: ${this.databaseUrl}`, error);
      throw error;
    }
  }

  /**
   * Clean up the database
   */
  async cleanup(): Promise<void> {
    if (this.prismaClient) {
      try {
        // Clear all data
        await this.prismaClient.$transaction(async (tx) => {
          await tx.$executeRaw`PRAGMA foreign_keys = OFF;`;
          await tx.guess.deleteMany();
          await tx.game.deleteMany();
          await tx.song.deleteMany();
          await tx.$executeRaw`PRAGMA foreign_keys = ON;`;
        });

        // Disconnect
        await this.prismaClient.$disconnect();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }

    // Clean up the database file for SQLite
    if (this.databaseUrl.startsWith('file:')) {
      const dbPath = this.databaseUrl.replace('file:', '');
      try {
        if (existsSync(dbPath)) {
          execSync(`rm -f "${dbPath}" "${dbPath}-journal"`, { stdio: 'pipe' });
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Get the Prisma client instance
   */
  getClient(): PrismaClient {
    if (!this.prismaClient) {
      throw new Error('Database not initialized. Call setup() first.');
    }
    return this.prismaClient;
  }
}

/**
 * Factory function to create a parallel test database
 */
export async function createParallelTestDb(): Promise<{
  prisma: PrismaClient;
  cleanup: () => Promise<void>;
}> {
  const testDb = new ParallelTestDatabase();
  const prisma = await testDb.setup();
  
  return {
    prisma,
    cleanup: () => testDb.cleanup()
  };
} 