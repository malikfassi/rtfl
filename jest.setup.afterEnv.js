/* eslint-disable */
// Import test environment setup
require('./src/app/api/lib/test/env/environment');
const { setupTestDb, cleanupTestDb, prisma } = require('./src/app/api/lib/test/env/db');

// Global setup
beforeAll(async () => {
  // Initialize test database once at the start
  await setupTestDb();
}, 30000); // Increase timeout for database setup

// Global cleanup
afterAll(async () => {
  await prisma.$disconnect();
  await cleanupTestDb();
}, 30000); // Increase timeout for cleanup 