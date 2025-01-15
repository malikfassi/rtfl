import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Clean up existing data
    await prisma.guess.deleteMany();
    await prisma.game.deleteMany();

    // Create initial game
    await prisma.game.create({
      data: {
        date: new Date('2024-01-14'),
        playlistId: 'test-playlist',
        randomSeed: 'test-seed',
      },
    });

    console.log('Seed data created successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
