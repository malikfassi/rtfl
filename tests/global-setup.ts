import { seedDatabase } from './playwright-seed';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import fetch from 'node-fetch';
import { execSync } from 'child_process';

async function waitForServer(url: string, maxAttempts: number = 30): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log('✅ Server is ready!');
        return;
      }
    } catch (error) {
      // Server not ready yet
    }
    console.log(`⏳ Waiting for server to start... (attempt ${i + 1}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error(`Server failed to start within ${maxAttempts * 2} seconds`);
}

async function globalSetup() {
  console.log('🚀 Setting up Playwright test environment...');
  
  // Load environment variables from .env.test
  config({ path: '.env.test' });
  
  // Wait for the server to be ready
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
  await waitForServer(baseUrl);
  
  // Run database migrations first
  console.log('🔄 Running database migrations...');
  try {
    execSync('npx prisma migrate deploy', { 
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      stdio: 'inherit'
    });
    console.log('✅ Database migrations completed');
  } catch (error) {
    console.error('❌ Error running migrations:', error);
  }
  
  // Clean the database first
  console.log('🧹 Cleaning test database...');
  const prisma = new PrismaClient();
  try {
    // Delete all data in reverse order of dependencies
    await prisma.guess.deleteMany();
    await prisma.game.deleteMany();
    await prisma.song.deleteMany();
    console.log('✅ Database cleaned successfully');
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
  } finally {
    await prisma.$disconnect();
  }
  
  // Seed the database with test data
  await seedDatabase();
  
  console.log('✅ Global setup completed!');
}

export default globalSetup; 