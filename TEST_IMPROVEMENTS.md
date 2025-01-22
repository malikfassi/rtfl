# Test Improvements Plan

## Current Setup

### Test Structure
```
src/
├── lib/
│   ├── services/__tests__/
│   │   ├── game.test.ts
│   │   ├── song.test.ts
│   │   ├── game.integration.test.ts
│   │   ├── song.integration.test.ts
│   │   └── guess.integration.test.ts
│   ├── clients/__tests__/
│   │   ├── genius.integration.test.ts
│   │   └── spotify.integration.test.ts
│   ├── clients/__mocks__/
│   │   ├── spotify.ts
│   │   └── genius.ts
│   ├── test/
│   │   ├── helpers.ts
│   │   └── utils.ts
│   └── fixtures/
│       ├── songs.ts
│       ├── games.ts
│       └── guesses.ts
└── app/api/admin/
    ├── games/__tests__/
    │   └── route.test.ts
    └── spotify/playlists/
        ├── __tests__/
        │   └── route.test.ts
        └── [id]/tracks/__tests__/
            └── route.test.ts
```

### Test Categories
1. **Service Tests**
   - Unit Tests:
     - `game.test.ts`: Game service unit tests
     - `song.test.ts`: Song service unit tests
   - Integration Tests:
     - `game.integration.test.ts`: Game service with DB
     - `song.integration.test.ts`: Song service with DB
     - `guess.integration.test.ts`: Guess service with DB

2. **Client Tests**
   - Integration Tests:
     - `genius.integration.test.ts`: Genius API integration
     - `spotify.integration.test.ts`: Spotify API integration
   - Mocks:
     - `spotify.ts`: Spotify client mocks
     - `genius.ts`: Genius client mocks

3. **API Route Tests**
   - `games/route.test.ts`: Game admin routes
   - `playlists/route.test.ts`: Spotify playlist routes
   - `playlists/[id]/tracks/route.test.ts`: Playlist tracks routes

4. **Test Utilities**
   - `helpers.ts`: Common test helpers
   - `utils.ts`: Test utility functions

5. **Fixtures**
   - `songs.ts`: Song fixtures (auto-generated)
   - `games.ts`: Game fixtures using Prisma types
   - `guesses.ts`: Guess fixtures using Prisma types

### Current Issues
1. **Integration Tests**
   - Incorrectly using mocks (e.g., mocking `createSongService` in integration tests)
   - Should use real implementations with test credentials
   - Need proper test data setup and cleanup
   - Inconsistent use of fixtures vs hardcoded data

2. **Test Organization**
   - No clear separation between unit and integration test setups
   - Duplicate test data across different test files
   - Missing common setup/cleanup utilities
   - Inconsistent use of test utilities

3. **Mocking Strategy**
   - Mix of Jest mocks and manual mocks
   - Hardcoded mock responses in `__mocks__`
   - Mocks not using fixtures for test data
   - Inconsistent mocking patterns

## Improvement Plan

### Phase 1: Test Organization
1. Create standardized test setup:
   ```
   src/lib/test/
   ├── setup/
   │   ├── unit.ts       (unit test setup)
   │   └── integration.ts (integration test setup)
   ├── cleanup/
   │   ├── unit.ts       (unit test cleanup)
   │   └── integration.ts (integration test cleanup)
   ├── factories/
   │   ├── song.ts       (song test data factory)
   │   ├── game.ts       (game test data factory)
   │   └── guess.ts      (guess test data factory)
   ├── mocks/
   │   ├── spotify.ts    (spotify mock factory)
   │   └── genius.ts     (genius mock factory)
   ├── helpers.ts        (existing)
   └── utils.ts          (existing)
   ```

2. Update Jest configuration:
   - Add test environment setup
   - Configure test paths
   - Set up test database handling

### Phase 2: Fixture Improvements
1. Update fixtures to use business logic types:
   ```
   src/lib/fixtures/
   ├── songs.ts        (existing)
   ├── games.ts        (using Prisma types)
   └── guesses.ts      (using Prisma types)
   ```

2. Create mock response fixtures:
   ```
   src/lib/fixtures/
   └── responses/
       ├── spotify/
       │   ├── tracks.ts
       │   └── playlists.ts
       └── genius/
           └── search.ts
   ```

### Phase 3: Test Implementation
1. Update unit tests:
   - Use Jest module mocks consistently
   - Use fixture factories for test data
   - Improve error case coverage

2. Update integration tests:
   - Remove manual mocks
   - Use real implementations
   - Use common setup/cleanup
   - Use fixtures for validation

3. Update API tests:
   - Use common request helpers
   - Improve error handling tests
   - Add validation tests

## Guidelines
- Unit tests should use Jest module mocks (`__mocks__`)
- Integration tests should use real implementations
- Use fixtures for test data and assertions
- Keep test setup/cleanup code DRY
- Maintain clear separation between unit and integration tests

## Progress
- [x] Initial analysis
- [x] Document current test structure
- [x] Update fixtures to use business logic types
- [x] Create test organization structure
  - [x] Create setup/cleanup structure
  - [x] Create test factories
  - [x] Create mock factories
- [x] Create mock response fixtures
  - [x] Spotify track responses
  - [x] Spotify playlist responses
  - [x] Genius search responses
- [x] Update Jest configuration
  - [x] Add test environment setup
  - [x] Configure test paths
  - [x] Set up database handling
- [x] Update unit tests
  - [x] Song service tests
  - [x] Game service tests
  - [x] Guess service tests
- [x] Update integration tests
  - [x] Song service integration tests
  - [x] Game service integration tests
  - [x] Guess service integration tests
  - [x] Playlists route tests
  - [x] Tracks route tests
- [x] Update API tests
  - [x] Game routes tests
  - [x] Spotify routes
  - [x] Admin routes

🎉 All test improvements completed! 