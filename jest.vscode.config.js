export default {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/src/app/api/**/*.test.{ts,tsx,js,jsx}',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(cheerio|genius-lyrics)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.afterEnv.js'],
  // Verbosity control
  verbose: false,
  silent: false,
  // Show only failed tests
  onlyFailures: false,
  // Increase timeout for integration tests
  testTimeout: 30000,
  // Custom reporters for better output
  reporters: [
    'default'
  ],
  // Clear mocks between tests
  clearMocks: true,
  // Reset modules between tests
  resetModules: true,
  // Restore mocks between tests
  restoreMocks: true,
}; 