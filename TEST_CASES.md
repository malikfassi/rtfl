# Test Cases - Abstract Patterns

## Common Behaviors

### Resource Retrieval
- ✅ Single Resource
  - Get track by ID
  - Get playlist by ID
  - Get game by date
  - Get player guesses
- ✅ Resource Collections
  - Search tracks/playlists
  - Get playlist tracks
  - Get games by month
- ✅ Empty Results
  - Empty search results
  - No games for month
  - No player guesses

### Resource Creation/Updates
- ✅ Basic Creation
  - Create song from Spotify track
  - Create game with song
  - Submit player guess
- ✅ Update/Upsert
  - Update game with new song
  - Normalize guess word casing/whitespace
- ✅ Data Validation
  - Validate date formats
  - Validate track metadata
  - Validate guess words

### Error Handling

#### Client Errors (4xx)
- ❌ Invalid Input
  - Missing required parameters
  - Invalid date/month formats
  - Empty/whitespace-only values
- ❌ Resource Not Found
  - Non-existent tracks/playlists
  - Non-existent games
  - Non-existent lyrics
- ❌ Business Rules
  - Duplicate guesses
  - Invalid guess words
  - Missing track metadata

#### Server Errors (5xx)
- ❌ External Service Failures
  - Spotify API errors
  - Genius API errors
- ❌ Internal Errors
  - Database errors
  - Service errors

## Integration Patterns

### External Services
- ✅ Spotify Integration
  - Track metadata retrieval
  - Search functionality
  - Playlist management
- ✅ Genius Integration
  - Lyrics retrieval
  - Artist/song matching

### Data Flow
- ✅ Spotify → Song → Game
  - Track data → Song creation → Game association
- ✅ Game → Guess
  - Game validation → Guess submission
- ✅ Song → Lyrics
  - Track metadata → Lyrics retrieval

### Data Normalization
- ✅ Text Processing
  - Case normalization
  - Whitespace trimming
  - Word validation
- ✅ Response Formatting
  - HTTP status codes
  - Error message structure
  - Success response structure

## Testing Strategies

### Unit Tests
- ✅ Service Logic
  - Business rules validation
  - Error handling
  - Data transformation

### Integration Tests
- ✅ External APIs
  - API response handling
  - Error propagation
  - Rate limiting/retry logic
- ✅ Database Operations
  - CRUD operations
  - Transaction handling
  - Data integrity

### End-to-End
- ✅ API Routes
  - Request validation
  - Response formatting
  - Error handling
- ✅ User Workflows
  - Game creation and updates
  - Player guessing flow
  - Search and retrieval

# Test Cases Catalog

## API Routes

### Spotify Routes

#### GET /api/admin/spotify/tracks/[id]
- ✅ Returns track when found
  - Input: `trackId: "3E7dfMvvCLUddWissuqMwr"`
  - Expected: 200 + track data
- ❌ Returns 404 when track not found
  - Input: `trackId: "nonexistent"`
  - Expected: 404 + error message
- ❌ Returns 500 on internal error
  - Input: `trackId: "123"`
  - Expected: 500 + error message

#### GET /api/admin/spotify/tracks/search
- ✅ Returns tracks when search successful
  - Input: `q: "test"`
  - Expected: 200 + track list
- ✅ Returns empty array when no tracks found
  - Input: `q: "test"`
  - Expected: 200 + empty array
- ❌ Returns 400 when query missing
  - Input: no query param
  - Expected: 400 + error message
- ❌ Returns 500 when search fails
  - Input: `q: "test"`
  - Expected: 500 + error message

#### GET /api/admin/spotify/playlists/[id]/tracks
- ✅ Returns tracks when found
  - Input: `playlistId: "123"`
  - Expected: 200 + track list
- ❌ Returns 400 when playlist ID missing
  - Input: empty ID
  - Expected: 400 + error message
- ❌ Returns 404 when playlist not found
  - Input: `playlistId: "nonexistent"`
  - Expected: 404 + error message
- ❌ Returns 500 when get playlist tracks fails
  - Input: `playlistId: "123"`
  - Expected: 500 + error message

#### GET /api/admin/spotify/playlists/search
- ✅ Returns playlists when search successful
  - Input: `q: "test"`
  - Expected: 200 + playlist list
- ✅ Returns empty array when no playlists found
  - Input: `q: "test"`
  - Expected: 200 + empty array
- ❌ Returns 400 when query missing
  - Input: no query param
  - Expected: 400 + error message
- ❌ Returns 500 when search fails
  - Input: `q: "test"`
  - Expected: 500 + error message

## Services

### SongService

#### searchTracks
- ✅ Returns tracks when search successful
  - Input: `query: "test query"`
  - Expected: Array of Spotify tracks
- ✅ Returns empty array when no tracks found
  - Input: `query: "test"`
  - Expected: Empty array
- ❌ Throws error when search fails
  - Input: `query: "test"`
  - Expected: Error propagation

#### getTrack
- ✅ Returns track when found
  - Input: `spotifyId: string`
  - Expected: Spotify track data
- ❌ Throws error when track not found
  - Input: `spotifyId: "123"`
  - Expected: Error propagation

#### create
- ✅ Creates song successfully
  - Input: `spotifyId: string`
  - Expected: Created song with Spotify and Genius data
- ❌ Throws error when track not found
  - Input: `spotifyId: "nonexistent"`
  - Expected: `SongError` with code `SPOTIFY_NOT_FOUND`
- ❌ Throws error when track has no preview URL
  - Input: Valid `spotifyId`
  - Expected: Error "Track has no preview URL"
- ❌ Throws error when track has no album images
  - Input: Valid `spotifyId`
  - Expected: Error "Track has no album image"
- ❌ Throws error when track has no artists
  - Input: Valid `spotifyId`
  - Expected: Error "Track has no artists"

### GameService

#### createOrUpdate
- ✅ Creates new game with song
  - Input: `date: "2025-01-17"`, `spotifyId: string`
  - Expected: New game with song data
- ✅ Updates existing game with new song
  - Input: `date: "2025-01-17"`, `spotifyId: string`
  - Expected: Updated game with new song data
- ❌ Throws error for invalid date format
  - Input: `date: "2025-1-17"`, `spotifyId: string`
  - Expected: `GameError` with code `INVALID_FORMAT`
- ❌ Throws error when song creation fails
  - Input: `date: "2025-01-17"`, `spotifyId: "nonexistent"`
  - Expected: `GameError` with code `NOT_FOUND`

#### getByDate
- ✅ Returns game for date when found
  - Input: `date: "2025-01-17"`
  - Expected: Game with song data
- ❌ Throws error when game not found
  - Input: `date: "2025-01-17"`
  - Expected: `GameError` with code `NOT_FOUND`

#### getByMonth
- ✅ Returns games for month when found
  - Input: `month: "2025-01"`
  - Expected: Array of games with song data
- ✅ Returns empty array when no games for month
  - Input: `month: "2020-01"`
  - Expected: Empty array
- ❌ Throws error for invalid month format
  - Input: `month: "2025-1"`
  - Expected: `GameError` with code `INVALID_FORMAT`

### GuessService

#### submitGuess
- ✅ Submits valid guess
  - Input: `gameId: string`, `playerId: string`, `word: "party"`
  - Expected: Created guess record
- ❌ Throws error when game not found
  - Input: `gameId: "nonexistent"`, `playerId: string`, `word: string`
  - Expected: `GuessError` with code `INTERNAL_ERROR`
- ❌ Throws error when word is empty
  - Input: `gameId: string`, `playerId: string`, `word: "   "`
  - Expected: `GuessError` with code `INVALID_WORD`
- ❌ Throws error for duplicate guess
  - Input: `gameId: string`, `playerId: string`, `word: string`
  - Expected: `GuessError` with code `DUPLICATE_GUESS`
- ❌ Throws error for invalid word
  - Input: `gameId: string`, `playerId: string`, `word: "nonexistentword"`
  - Expected: `GuessError` with code `INVALID_WORD`

#### getPlayerGuesses
- ✅ Returns guesses for player
  - Input: `gameId: string`, `playerId: string`
  - Expected: Array of player's guesses
- ✅ Returns empty array when no guesses found
  - Input: `gameId: string`, `playerId: string`
  - Expected: Empty array
- ❌ Throws error when game not found
  - Input: `gameId: "nonexistent"`, `playerId: string`
  - Expected: `GuessError` with code `INTERNAL_ERROR`

## Integration Tests

### GeniusClient

#### searchSong
- ✅ Returns lyrics when song found
  - Input: `title: string`, `artist: string`
  - Expected: Song lyrics
- ✅ Returns null when song not found
  - Input: `title: "nonexistent song"`, `artist: "nonexistent artist"`
  - Expected: `null`
- ❌ Throws error when search fails
  - Input: Empty title and artist
  - Expected: `GeniusError`

### SpotifyClient

#### getTrack
- ✅ Returns track when found
  - Input: `trackId: string`
  - Expected: Track data
- ❌ Throws error when track not found
  - Input: `trackId: "nonexistent"`
  - Expected: `SpotifyError`

#### searchTracks
- ✅ Returns tracks when found
  - Input: `query: string`
  - Expected: Array of tracks
- ✅ Returns empty array when no tracks found
  - Input: `query: "nonexistent track title"`
  - Expected: Empty array

#### getPlaylist
- ✅ Returns playlist when found
  - Input: `playlistId: string`
  - Expected: Playlist data
- ❌ Throws error when playlist not found
  - Input: `playlistId: "nonexistent"`
  - Expected: `SpotifyError`

#### searchPlaylists
- ✅ Returns playlists when found
  - Input: `query: string`
  - Expected: Array of playlists
- ✅ Returns empty array when no playlists found
  - Input: `query: "nonexistent playlist title"`
  - Expected: Empty array

### Service Integration Tests

#### SongService
- ✅ Creates song successfully with lyrics
  - Input: `spotifyId: string`
  - Expected: Song with lyrics > 100 chars
- ❌ Throws error when track not found
  - Input: `spotifyId: "nonexistent"`
  - Expected: `SongError` with code `SPOTIFY_NOT_FOUND`
- ❌ Throws error when lyrics not found
  - Input: `spotifyId: "no-lyrics-track"`
  - Expected: `SongError` with code `GENIUS_NOT_FOUND`

#### GameService
- ✅ Creates new game with song
  - Input: `date: "2025-01-17"`, `spotifyId: string`
  - Expected: Game with song and lyrics
- ✅ Updates existing game with new song
  - Input: `date: "2025-01-17"`, `spotifyId: string`
  - Expected: Updated game with new song
- ❌ Throws error for invalid date format
  - Input: `date: "2025-1-17"`, `spotifyId: string`
  - Expected: `GameError` with code `INVALID_FORMAT`
- ❌ Throws error for non-existent track
  - Input: `date: "2025-01-17"`, `spotifyId: "invalid123456789"`
  - Expected: `SongError` with code `SPOTIFY_NOT_FOUND`

#### GuessService
- ✅ Accepts words from song title
  - Input: `word: "Party"`
  - Expected: Guess with normalized word
- ✅ Accepts words from artist name
  - Input: `word: "Miley"`
  - Expected: Guess with normalized word
- ✅ Accepts words from lyrics
  - Input: `word: "butterflies"`
  - Expected: Guess with normalized word
- ✅ Accepts words with different casing
  - Input: `word: "PARTY"`
  - Expected: Guess with normalized word
- ✅ Accepts words with extra whitespace
  - Input: `word: "  Party  "`
  - Expected: Guess with normalized word
- ❌ Rejects duplicate guesses (same case)
  - Input: Same word twice
  - Expected: `GuessError` with code `DUPLICATE_GUESS`
- ❌ Rejects duplicate guesses (different case)
  - Input: Same word with different case
  - Expected: `GuessError` with code `DUPLICATE_GUESS`
- ❌ Rejects invalid words
  - Input: `word: "invalid"`
  - Expected: `GuessError` with code `INVALID_WORD`
- ❌ Rejects empty words
  - Input: `word: ""`
  - Expected: `GuessError` with code `INVALID_WORD`
- ❌ Rejects whitespace-only words
  - Input: `word: "   "`
  - Expected: `GuessError` with code `INVALID_WORD`
- ❌ Rejects words for non-existent game
  - Input: `gameId: "invalid-game-id"`
  - Expected: `GuessError` with code `INTERNAL_ERROR`
- ✅ Returns guesses in descending order
  - Input: Multiple guesses
  - Expected: Ordered by creation time
- ✅ Returns empty array for player with no guesses
  - Input: Player with no guesses
  - Expected: Empty array
- ✅ Returns guesses only for specified player
  - Input: Multiple players' guesses
  - Expected: Only specified player's guesses

Let me continue reading the service integration test files to add more test cases. Should I continue? 