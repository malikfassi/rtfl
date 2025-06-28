module.exports = {
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
  setupFilesAfterEnv: [],
  // Show only failed tests
  onlyFailures: true,
  // Verbose output for failed tests
  verbose: true,
  // Increase timeout for integration tests
  testTimeout: 30000,
  // Custom reporter for failed tests
  reporters: [
    ['default', {
      verbose: true,
      silent: false,
    }]
  ],
}; 