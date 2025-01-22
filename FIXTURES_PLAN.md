# Fixtures Generation Plan

## 1. Core Data Models

### Spotify Data
- 🎵 Tracks
  - Required fields: id, name, preview_url, artists, album (with images)
  - Edge cases: missing preview_url, empty artists, no album images
  - Variations: different artist counts, image qualities

- 📂 Playlists
  - Basic playlist with tracks
  - Empty playlist
  - Playlist with max tracks

### Genius Data
- 📝 Lyrics
  - Full lyrics with multiple verses
  - Short lyrics
  - Lyrics with special characters
  - Missing/null lyrics cases

### Game Data
- 🎮 Games
  - Single day games
  - Full month of games
  - Games with different song types
  - Edge cases: invalid dates

### Guess Data
- 🎯 Player Guesses
  - Multiple guesses per game
  - Multiple players
  - Various word types (title, artist, lyrics)
  - Edge cases: invalid/duplicate words

## 2. Integration Scenarios

### Spotify → Song Flow
```typescript
// Example fixture generation
const generateSpotifyToSong = async () => {
  const track = generateSpotifyTrack({
    withPreview: true,
    withArtists: true,
    withAlbumImages: true
  });
  
  const lyrics = generateGeniusLyrics({
    fromTitle: track.name,
    fromArtist: track.artists[0].name
  });

  return createSongFixture({
    spotifyData: track,
    geniusData: { lyrics }
  });
};
```

### Game → Guess Flow
```typescript
// Example fixture generation
const generateGameWithGuesses = async () => {
  const song = await generateSpotifyToSong();
  const game = createGameFixture({
    date: "2025-01-17",
    song
  });
  
  return addGuessFixtures(game, {
    validWords: ["party", "miley", "butterflies"],
    invalidWords: ["invalid", ""],
    duplicateWords: ["party", "PARTY"]
  });
};
```

## 3. Error Scenarios

### External API Errors
```typescript
// Example error fixtures
const generateAPIErrors = {
  spotify: {
    trackNotFound: new SpotifyError("Track not found", "NOT_FOUND"),
    rateLimited: new SpotifyError("Rate limit exceeded", "RATE_LIMIT"),
    serverError: new SpotifyError("Internal server error", "SERVER_ERROR")
  },
  genius: {
    lyricsNotFound: new GeniusError("Lyrics not found", "NOT_FOUND"),
    searchFailed: new GeniusError("Search failed", "SEARCH_ERROR")
  }
};
```

### Validation Errors
```typescript
// Example validation fixtures
const generateValidationErrors = {
  dates: {
    invalid: "2025-1-17",
    outOfRange: "2030-13-45"
  },
  words: {
    empty: "",
    whitespace: "   ",
    notInLyrics: "nonexistentword"
  }
};
```

## 4. Implementation Strategy

### Phase 1: Base Fixtures
1. Create core model generators
2. Implement basic success cases
3. Add common error cases

### Phase 2: Edge Cases
1. Add boundary conditions
2. Implement error variations
3. Add complex scenarios

### Phase 3: Integration
1. Create combined fixtures
2. Add workflow scenarios
3. Implement full E2E cases

### Phase 4: Maintenance
1. Add fixture versioning
2. Implement regeneration triggers
3. Add validation checks

## 5. Usage Examples

### Unit Tests
```typescript
describe('SongService', () => {
  it('creates song with valid track', async () => {
    const { track, lyrics } = await fixtures.generateSpotifyToSong();
    // Test implementation
  });
});
```

### Integration Tests
```typescript
describe('Game Flow', () => {
  it('completes full game cycle', async () => {
    const { game, guesses } = await fixtures.generateGameWithGuesses();
    // Test implementation
  });
});
```

### E2E Tests
```typescript
describe('API Routes', () => {
  it('handles complete user workflow', async () => {
    const scenario = await fixtures.generateFullGameScenario();
    // Test implementation
  });
}); 