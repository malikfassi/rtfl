# Test Updates Progress

## Error Verification Process
Before marking any test file as complete, verify against ALL error files:

### Domain & API Errors (to keep)
- [x] base.ts (Base classes)
  - [x] AppError (used indirectly)
  - [x] NotFoundError (used indirectly)
  - [x] InternalError (used indirectly)
  - [x] ValidationError (replaced with Zod)

- [x] spotify.ts (API/Domain errors)
  - [x] SpotifyApiError
  - [x] TrackNotFoundError
  - [ ] PlaylistNotFoundError (not needed for song service)
  - [x] NoMatchingTracksError
  - [ ] NoMatchingPlaylistsError (not needed for song service)
  - [ ] NoTracksInPlaylistError (not needed for song service)
  - [ ] PlaylistTracksError (not needed for song service)

- [x] genius.ts (API/Domain errors)
  - [x] GeniusApiError
  - [x] NoLyricsFoundError
  - [x] NoMatchingLyricsError
  - [x] LyricsExtractionError

- [x] game.ts (Domain errors)
  - [x] GameNotFoundError

- [x] guess.ts (Domain errors)
  - [x] DuplicateGuessError
  - [x] InvalidWordError
  - [x] GameNotFoundForGuessError

- [x] song.ts (Domain errors)
  - [x] NoLyricsFoundError
  - [x] SongNotFoundError

### Validation (now handled by Zod)
All input validation is now handled by Zod schemas in @/lib/validation:
- [x] spotifyIdSchema (used in song.test.ts)
- [x] searchQuerySchema (used in song.test.ts)
- [x] gameDateSchema (used in game.test.ts)
- [x] gameMonthSchema (used in game.test.ts)
- [x] gameIdSchema (used in guess.test.ts)
- [x] playerIdSchema (used in guess.test.ts)
- [x] wordSchema (used in guess.test.ts)
- [ ] songTitleSchema
- [ ] artistNameSchema
- [ ] submitGuessSchema
- [ ] searchSongSchema

## Service Unit Tests
- [x] src/lib/services/__tests__/song.test.ts
  - [x] Updated error types to use new system
  - [x] Added validation error tests
  - [x] Improved error handling test cases
  - [x] Fixed type safety issues
  - [x] Verified against all error files
  - [x] Added missing Genius error cases
  - [x] Updated to use Zod validation
- [x] src/lib/services/__tests__/game.test.ts
  - [x] Updated error types to use new system
  - [x] Added validation error tests
  - [x] Improved error handling test cases
  - [x] Fixed type safety issues
  - [x] Verified against all error files
  - [x] Updated to use Zod validation
  - [x] Added getByMonth test suite
- [x] src/lib/services/__tests__/guess.test.ts
  - [x] Updated error types to use new system
  - [x] Added validation error tests
  - [x] Improved error handling test cases
  - [x] Fixed type safety issues
  - [x] Verified against all error files
  - [x] Updated to use Zod validation
  - [x] Added getPlayerGuesses test suite

## Service Integration Tests
- [x] src/lib/services/__tests__/song.integration.test.ts
- [x] src/lib/services/__tests__/game.integration.test.ts
- [x] src/lib/services/__tests__/guess.integration.test.ts

## API Route Integration Tests

### Spotify Routes
- [x] src/app/api/admin/spotify/playlists/search/__tests__/route.integration.test.ts
- [x] src/app/api/admin/spotify/playlists/[id]/tracks/__tests__/route.integration.test.ts
- [x] src/app/api/admin/spotify/tracks/search/__tests__/route.integration.test.ts
- [x] src/app/api/admin/spotify/tracks/[id]/__tests__/route.integration.test.ts

### Game Routes
- [x] src/app/api/admin/games/[date]/__tests__/route.integration.test.ts
- [x] src/app/api/admin/games/__tests__/route.integration.test.ts

## Update Plan
1. Update service unit tests first to ensure core error handling works ✅
2. Update Genius client and fixtures
   - [x] Remove custom GeniusSearchResult type, use official type from @/types/genius
   - [x] Remove searchSong method from GeniusClient
   - [x] Add getLyrics method to extract lyrics from URL
   - [x] Update fixture generation:
     - [x] Store raw HTML pages for each URL
     - [x] Store extracted lyrics with HTML
     - [x] Update mock to use new data structure
   - [x] Run fixture generation to create new test data
   - [x] Update mocks to use generated fixtures:
     - [x] GeniusClientMock:
       - [x] Use real search responses from fixtures
       - [x] Use real HTML pages and extracted lyrics
       - [x] Match error behavior with real client
     - [x] SpotifyClientMock:
       - [x] Use real track data from fixtures
       - [x] Use real search responses
       - [x] Match error behavior with real client
   - [x] Add fixture helpers:
     - [x] Create createSongFromTrack helper to generate Song objects from fixture tracks
     - [x] Create createGameFromTrack helper to generate Game objects from fixture tracks
     - [x] Create createGuessFromGame helper to generate Guess objects from fixture games
     - [x] Update test setup to use helpers
     - [x] Update test assertions to use helpers
   - [x] Update all tests to use new client structure
3. Update SongService to store complete Genius data
   - [x] Store full GeniusSearchResponse in database
   - [x] Update fetchExternalData to return [Track, GeniusSearchResponse, string]
   - [x] Update createSongInDb to accept GeniusSearchResponse
   - [x] Update tests to verify correct Genius data storage
4. Update service integration tests to verify error propagation

## Fixture Helpers
The following helpers will be added to `src/lib/test/fixtures/prisma.ts`:

### Song Helpers
```typescript
export function createSongFromTrack(track: Track, geniusResponse: GeniusSearchResponse): Song {
  return {
    id: '1', // Default test ID
    spotifyId: track.id,
    spotifyData: track,
    geniusData: geniusResponse,
    lyrics: getLyrics(track.id),
    maskedLyrics: getMaskedLyrics(track.id),
    createdAt: new Date(),
    updatedAt: new Date()
  };
}
```

### Game Helpers
```typescript
export function createGameFromTrack(track: Track, date: Date): Game {
  return {
    id: '1', // Default test ID
    date,
    spotifyId: track.id,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}
```

### Guess Helpers
```typescript
export function createGuessFromGame(game: Game, playerId: string, word: string): Guess {
  return {
    id: '1', // Default test ID
    gameId: game.id,
    playerId,
    word,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}
```

### Usage in Tests
```typescript
// In test setup
const track = spotifyData.tracks[trackId];
const geniusResponse = geniusData.search[`${track.name} ${track.artists[0].name}`];
const testSong = createSongFromTrack(track, geniusResponse);

// In assertions
expect(result).toEqual(testSong);
```

## Process for Each Test File
1. Read all error files to understand possible errors
2. Check which errors apply to the current service/route
3. Update tests to handle all applicable errors
4. Verify against error checklist above
5. Mark as complete in progress

## Mock Data Guidelines
1. Always use generated fixtures from real API responses
2. Store complete API responses to match real behavior
3. Match error conditions with real clients:
   - API errors (rate limits, network issues)
   - Not found errors (no results, invalid IDs)
   - Validation errors (invalid input)
   - Extraction errors (HTML parsing issues)

## Test Data Assertions
1. Use fixture data for exact response matching:
   - Compare full Spotify track objects
   - Compare full Genius search responses
   - Compare extracted lyrics with known good results
2. Test data transformations:
   - Verify Genius HTML -> lyrics extraction
   - Verify track data -> search query construction
   - Verify lyrics -> masked lyrics conversion
3. Test data persistence:
   - Verify database records match fixture data
   - Verify JSON serialization/deserialization
   - Verify all required fields are stored
4. Test error cases with real examples:
   - Use real invalid track IDs
   - Use real failed search queries
   - Use real HTML pages that fail extraction 