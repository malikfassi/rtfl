# Test Guidelines

## Core Principles

1. **Test Organization**
   - One test file per component/service
   - Group tests by functionality/method
   - Cover both success and error paths
   - Follow AAA pattern (Arrange-Act-Assert)

2. **Test Context**
   - Use `setupUnitTest()` for unit tests
   - Use `setupIntegrationTest()` for integration tests
   - Clean up after each test
   - Reset mocks between tests

3. **Fixtures**
   - Access via `context.fixtures`
   - Use constants for IDs: `context.constants.ids`
   - Never hardcode test data
   - Generate new fixtures using `generateFixtures()`

4. **Validation**
   - Use appropriate validator for test type:
     ```typescript
     // Unit tests - focus on strict data shape and mock verification
     unit_validator.spotify_client.track(track, id);
     expect(mockSpotifyClient.getTrack).toHaveBeenCalledWith(id);

     // Integration tests - focus on real API behavior and data integrity
     try {
       integration_validator.spotify_client.track(track, id);
     } catch (error) {
       console.log('Validation failed:', {
         track,
         error,
         expectedId: id
       });
       throw error;
     }
     ```
   - Unit Validators:
     - Focus on type/structure correctness
     - Verify mock interactions
     - Strict fixture matching
     - Fast failure detection
   
   - Integration Validators:
     - Focus on API behavior
     - Handle real-world data variations
     - Include detailed debug info
     - Validate business rules

   - Validation Best Practices:
     - Keep validators focused and single-purpose
     - Add descriptive error messages
     - Include relevant debug context
     - Consider extracting common validation logic to shared utilities

5. **Mocking**
   - Create mocks via factory methods:
     ```typescript
     const mockClient = SpotifyMocks.createClient();
     ```
   - Mock at the lowest possible level
   - Verify mock calls
   - Use fixtures in mock responses

## Test Types

### Unit Tests
```typescript
describe('SpotifyClient', () => {
  let context: UnitTestContext;
  let client: SpotifyClient;

  beforeEach(() => {
    context = setupUnitTest();
    client = new SpotifyClient(context.mockSpotifyClient);
  });

  it('should handle success case', async () => {
    const id = context.constants.ids.SPOTIFY.TRACKS.PARTY_IN_THE_USA;
    const track = await client.getTrack(id);
    context.validator.unit.spotify_client.track(track, id);
    expect(context.mockSpotifyClient.getTrack).toHaveBeenCalledWith(id);
  });
});
```

### Integration Tests
```typescript
describe('SpotifyClient', () => {
  let context: IntegrationTestContext;
  let client: SpotifyClient;

  beforeEach(async () => {
    context = await setupIntegrationTest();
    client = new SpotifyClient(process.env.API_KEY);
  });

  afterEach(async () => {
    await context.cleanup();
  });

  it('should handle success case', async () => {
    const id = context.constants.ids.SPOTIFY.TRACKS.PARTY_IN_THE_USA;
    const track = await client.getTrack(id);
    try {
      context.validator.integration.spotify_client.track(track, id);
    } catch (error) {
      console.log('Debug info:', { track, error });
      throw error;
    }
  });
});
```

## Common Mistakes to Avoid

1. ❌ Don't use real APIs in unit tests
2. ❌ Don't skip error path testing
3. ❌ Don't use hardcoded test data
4. ❌ Don't mix unit and integration patterns
5. ❌ Don't skip cleanup in integration tests
6. ❌ Don't ignore type safety
7. ❌ Don't duplicate validation logic

## Best Practices

1. ✅ Use TypeScript for type safety
2. ✅ Keep tests focused and atomic
3. ✅ Use descriptive test names
4. ✅ Add debug info for failures
5. ✅ Validate responses thoroughly
6. ✅ Clean up test data
7. ✅ Use shared fixtures
8. ✅ Mock external dependencies 