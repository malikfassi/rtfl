const shared = {
  testEnvironment: 'node',
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
  testTimeout: 30000,
};

module.exports = {
  // Verbosity control
  verbose: false,
  silent: false,
  // Show only failed tests
  onlyFailures: false,
  // Custom reporters for better output
  reporters: [
    'default'
  ],
  projects: [
    {
      ...shared,
      displayName: 'unit',
      testMatch: ['<rootDir>/src/app/api/**/*.unit.test.{ts,tsx,js,jsx}'],
    },
    {
      ...shared,
      displayName: 'integration',
      testMatch: ['<rootDir>/src/app/api/**/*.integration.test.{ts,tsx,js,jsx}'],
    },
  ],
};
