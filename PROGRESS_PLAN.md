# Test Data Restructuring Progress Plan

## 1. Define Test Cases Structure
- [ ] Create `src/lib/test/cases/index.ts` with TEST_CASES enum
- [ ] Create test input files per service/route:
  - [ ] `src/lib/test/cases/services/game.ts`
  - [ ] `src/lib/test/cases/services/song.ts`
  - [ ] `src/lib/test/cases/routes/spotify.ts`
  - [ ] `src/lib/test/cases/routes/genius.ts`

## 2. Update Fixture Generator
- [ ] Restructure `scripts/generate-fixtures.ts`:
  - [ ] Import test cases and inputs
  - [ ] Create separate generators for each API:
    - [ ] SpotifyDataGenerator
    - [ ] GeniusDataGenerator
  - [ ] Create expected output generators for each service/route

## 3. Generate API Response Fixtures
- [ ] Create fixture files for raw API responses:
  - [ ] `src/lib/test/fixtures/spotify.ts`
  - [ ] `src/lib/test/fixtures/genius.ts`
- [ ] Each file should contain raw API responses per test case

## 4. Generate Expected Outputs
- [ ] Create expected output files per service/route:
  - [ ] `src/lib/test/expected/services/game.ts`
  - [ ] `src/lib/test/expected/services/song.ts`
  - [ ] `src/lib/test/expected/routes/spotify.ts`
  - [ ] `src/lib/test/expected/routes/genius.ts`

## 5. Update Mock Clients
- [ ] Update mock clients to use new fixture structure:
  - [ ] `src/lib/test/test-env/mocks/spotify.ts`
  - [ ] `src/lib/test/test-env/mocks/genius.ts`

## 6. Update Tests
- [ ] Update service tests to use new structure:
  - [ ] `src/lib/services/__tests__/game.test.ts`
  - [ ] `src/lib/services/__tests__/song.test.ts`
- [ ] Update route tests:
  - [ ] `src/app/api/admin/spotify/**/__tests__/*.test.ts`
  - [ ] `src/app/api/admin/genius/**/__tests__/*.test.ts`

## 7. Documentation
- [ ] Update `src/lib/test/TEST_ARCHITECTURE.md`
- [ ] Add examples of using new test data structure
- [ ] Document generator usage and configuration

## Directory Structure
```
src/lib/test/
├── cases/                 # Test cases and inputs
│   ├── index.ts          # TEST_CASES enum
│   ├── services/         # Service test inputs
│   └── routes/           # Route test inputs
├── fixtures/             # Raw API responses
│   ├── spotify.ts        # Spotify API responses
│   └── genius.ts         # Genius API responses
├── expected/             # Expected outputs
│   ├── services/         # Service expected outputs
│   └── routes/           # Route expected outputs
└── test-env/            # Test environment setup
    └── mocks/           # Updated mock clients
```

## Implementation Order
1. Define test cases and inputs
2. Update generator structure
3. Generate API fixtures
4. Generate expected outputs
5. Update mock clients
6. Update tests
7. Update documentation 