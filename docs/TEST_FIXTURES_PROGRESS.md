# Fixtures Update Progress

## 1. Test Case Structure Updates
- [x] Update `src/lib/test/fixtures/TEST_CASES.ts`:
  - [x] Define core interfaces (SongTestCase, PlaylistTestCase, MaskedLyrics)
  - [x] Add specific test cases:
    - English Songs: PARTY_IN_THE_USA, BABY_ONE_MORE_TIME, etc.
    - French Songs: LA_VIE_EN_ROSE, NE_ME_QUITTE_PAS, etc.
    - Special Cases: INSTRUMENTAL_TRACK, UNKNOWN_SONG
  - [x] Add type-safe keys (SPOTIFY_IDS, PLAYLIST_IDS)
  - [x] Add helper functions for creating test cases

## 2. Fixture Generator Updates
- [x] Update `scripts/generate-fixtures.ts`:
  - [x] Add error handling for API failures
  - [x] Add validation for generated fixtures
  - [x] Add progress logging
  - [x] Add TypeScript type generation
  - [x] Add support for French songs

## 3. Directory Structure Updates
### Core Files
- [x] `src/lib/test/fixtures/json/`
  - [x] Create directory structure
  - [x] Add generated JSON files

- [x] `src/lib/test/fixtures/test-cases/`
  - [x] Update TypeScript type generation
  - [x] Add new test case types

- [x] `src/lib/test/fixtures/index.ts`
  - [x] Update exports
  - [x] Add new validators
  - [x] Update documentation

## 4. Client Mock Updates
- [x] Update Spotify client mocks:
  - [x] Simplify mock implementations
  - [x] Add FixtureNotFoundError for missing fixtures
  - [x] Remove error handling (handled by fixtures)

- [x] Update Genius client mocks:
  - [x] Simplify mock implementations
  - [x] Add FixtureNotFoundError for missing fixtures
  - [x] Remove error handling (handled by fixtures)

## 5. Validation Helper Updates
- [x] Unit test validators:
  - [x] Update song validation for all cases
  - [x] Update playlist validation for all cases
  - [x] Add null-case handling

- [x] Integration test validators:
  - [x] Update song validation with essential properties
  - [x] Update playlist validation with essential properties
  - [x] Add null-case handling

## 6. Test Implementation Updates
### Service Tests
- [ ] `src/lib/services/__tests__/song.test.ts`
- [ ] `src/lib/services/__tests__/game.test.ts`
- [ ] `src/lib/services/__tests__/guess.test.ts`

### Integration Tests
- [ ] `src/lib/services/__tests__/song.integration.test.ts`
- [ ] `src/lib/services/__tests__/game.integration.test.ts`
- [ ] `src/lib/services/__tests__/guess.integration.test.ts`

### API Tests
- [ ] `src/app/api/admin/games/__tests__/route.integration.test.ts`

## 7. Best Practices Implementation
- [x] Replace hardcoded responses with generated fixtures
- [ ] Add API change detection
- [ ] Set up version control for fixture data
- [x] Document special cases in generator script
- [x] Add validation helpers for all test types

## Next Steps
1. [ ] Update tests to use new fixtures
2. [ ] Add API change detection
3. [ ] Set up version control for fixtures

## Notes
- Each test case represents a real song/playlist with specific characteristics
- Test cases now include both English and French songs
- Special cases handle instrumental tracks and error scenarios
- Helper functions make it easy to add new test cases
- All test case definitions are centralized in TEST_CASES.ts 