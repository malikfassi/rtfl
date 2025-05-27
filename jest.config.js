/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/app/api/lib/test/env/environment.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/.history/'
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
    }]
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  projects: [
    {
      displayName: 'unit',
      testMatch: ['**/*.unit.test.ts'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/src/app/api/lib/test/env/environment.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          useESM: true,
        }]
      },
      extensionsToTreatAsEsm: ['.ts', '.tsx']
    },
    {
      displayName: 'integration',
      testMatch: ['**/*.integration.test.ts'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/src/app/api/lib/test/env/environment.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          useESM: true,
        }]
      },
      extensionsToTreatAsEsm: ['.ts', '.tsx']
    }
  ]
}; 