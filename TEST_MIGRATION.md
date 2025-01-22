# Test Migration Status

## Service Tests
- ✅ `src/lib/services/__tests__/song.test.ts` - Updated to use fixture data with AAA pattern and parameterized tests
- ✅ `src/lib/services/__tests__/guess.test.ts` - Updated to use fixture data with AAA pattern and parameterized tests
- ✅ `src/lib/services/__tests__/game.test.ts` - Updated to use fixture data with AAA pattern and parameterized tests
- ✅ `src/lib/services/__tests__/guess.integration.test.ts` - Updated to use fixture data with AAA pattern and parameterized tests
- ✅ `src/lib/services/__tests__/game.integration.test.ts` - Updated to use fixture data with AAA pattern and parameterized tests

## API Route Tests
- ✅ `src/app/api/admin/games/__tests__/route.test.ts` - Updated to use fixture data with AAA pattern
- ✅ `src/app/api/admin/spotify/tracks/[id]/__tests__/route.test.ts` - Updated to use fixture data with AAA pattern

## Client Tests
- ✅ `src/lib/clients/__tests__/genius.integration.test.ts` - Already using fixture data

## Migration Steps
1. Remove test utilities and use fixture data directly
2. Follow AAA pattern (Arrange-Act-Assert) for test structure
3. Use parameterized tests where applicable
4. Keep test data minimal for error cases
5. Use real fixture data for success cases

## Available Fixture Data
- `spotifyData` - Contains track information and search results
- `geniusData` - Contains song metadata and search results
- `lyricsData` - Contains lyrics and masked lyrics for songs

## Notes
- Fixture data is stored in JSON files and imported via TypeScript modules
- Each test should use the minimum data needed for its specific case
- Error cases can use minimal mock data
- Success cases should use real fixture data

## Migration Complete ✅
All test files have been updated to:
1. Use fixture data directly from source
2. Follow AAA pattern for better readability
3. Use parameterized tests where applicable
4. Keep test data minimal and focused
5. Use real fixture data for success cases

## Migration Guidelines
1. Follow Arrange-Act-Assert pattern with clear section comments
2. Use real fixture data for happy paths:
   - `spotifyData` for track info
   - `geniusData` for song metadata
   - `lyricsData` for lyrics and masked lyrics
3. Use minimal mock data for error cases
4. Remove redundant mock verifications
5. Use `expect.any()` for non-deterministic values
6. Parameterize tests with real track IDs where applicable

## Integration Test Guidelines
1. Focus on end-to-end flows:
   - Setup database with real fixture data
   - Test complete user journeys
   - Verify data persistence
2. Use transaction rollback for test isolation
3. Minimize mocking - only external services
4. Use real fixture data for requests/responses

## Next Steps
1. Update API route tests:
   - Use fixture data for request bodies
   - Test response formats with real data
   - Verify error handling with invalid inputs 