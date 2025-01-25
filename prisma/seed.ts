import { PrismaClient } from '@prisma/client';
import { seedDatabase } from '../src/app/api/lib/test/fixtures/core/seed-scenarios';

const prisma = new PrismaClient();

async function main() {
  // Seed both test scenarios
  await seedDatabase(prisma, ['BASIC', 'MIXED_LANGUAGES']);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 