# Technical Requirements

## Stack
- Framework: Next.js 14 with App Router
- Language: TypeScript with strict mode
- Database: SQLite with Prisma ORM
- Testing: Jest for API tests
- Linting: ESLint + Prettier
- State Management: React Context + Hooks (no Redux needed for this scope)

## Database Schema (Prisma)

### Core Data
#### GameConfig
- id: String (UUID)
- date: DateTime (unique)
- randomSeed: String
- playlistId: String      // spotify playlist id
- overrideSongId: String? // optional spotify track id
- createdAt: DateTime
- updatedAt: DateTime

### Cache Tables
#### CachedSpotifyTrack
- spotifyId: String (unique)
- data: JSON             // full spotify track data
- updatedAt: DateTime

#### CachedSpotifyPlaylist
- spotifyId: String (unique)
- data: JSON             // playlist metadata + tracks
- updatedAt: DateTime

#### CachedGeniusLyrics
- geniusId: String (unique)
- spotifyId: String      // to link with spotify track
- lyrics: Text           // original lyrics
- updatedAt: DateTime

### User Data
#### Guess
- id: String (UUID)
- userId: String         // from localStorage
- gameConfigId: String   // ref to GameConfig
- word: String
- timestamp: DateTime

## API Types

### Public Routes
```typescript
// GET /daily
// Redirects to /daily/<today_date>

// GET /daily/:date
interface GameStateResponse {
    id: string;
    date: string;
    guessAttempts: Array<{
        word: string;
        timestamp: string;
    }>;
    hiddenSong: {
        maskedLyrics: string;      // computed from lyrics + guesses
        maskedTitle: string;       // computed from title + guesses
        maskedArtist: string;      // computed from artist + guesses
        // null until ALL words in both title AND artist are found
        spotify: null | {
            artistName: string;
            songTitle: string;
            albumCover: string;
            previewUrl: string;
        };
        genius: null | {
            lyrics: string;
        };
    };
}

// POST /daily/:date/guess
interface GuessRequest {
    word: string;
}

// GET /archive
interface ArchiveResponse {
    games: GameStateResponse[];
}

// Error Responses
interface ApiError {
    code: 'GAME_NOT_FOUND' |      // No GameConfig for date
          'INVALID_DATE' |        // Malformed date
          'RATE_LIMITED' |        // Too many guesses
          'INVALID_WORD';         // Word validation failed
    message: string;
}

### Admin Routes

// Common Types
interface SpotifyTrack {
    id: string;
    name: string;
    artist: string;
    previewUrl: string;
}

interface SpotifyPlaylist {
    id: string;
    name: string;
    tracks: SpotifyTrack[];
}

// GET /admin/games
// Lists all game configs with enriched data
type ListGamesResponse = GameConfigResponse[];

// GET /admin/games/:date
interface GameConfigResponse {
    // Core Data
    id: string;
    date: string;
    playlistId: string;
    overrideSongId: string | null;
    
    // Enriched from Cache
    selectedSong: SpotifyTrack;    // resolved from overrideSongId or playlist+seed
    playlist: SpotifyPlaylist;     // resolved from playlistId
    lyrics: string;                // from genius cache
    
    // Computed Stats
    stats: {
        totalPlayers: number;
        totalGuesses: number;
        completionRate: number;
    };
}

// POST /admin/games/batch
interface BatchCreateRequest {
    startDate: string;    // inclusive
    endDate: string;      // inclusive
    playlistId: string;   // spotify playlist id
}

// Playlist Selection
// GET /admin/spotify/search/playlists?q=query
interface PlaylistSearchResponse {
    playlists: Array<{
        id: string;
        name: string;
        trackCount: number;
    }>;
}

// POST /admin/games/:date/playlist
interface UpdatePlaylistRequest {
    playlistId: string;   // spotify playlist id
}
// Response: GameConfigResponse
// Side effects: 
// - Updates playlistId
// - Clears overrideSongId
// - Caches playlist data
// - Resolves and caches new song from seed
// - Caches lyrics

// POST /admin/games/:date/override
interface SetOverrideRequest {
    songId: string;       // spotify track id from current playlist
}
// Response: GameConfigResponse
// Side effects:
// - Sets overrideSongId
// - Caches track data if needed
// - Caches lyrics if needed

// DELETE /admin/games/:date/override
// Response: GameConfigResponse
// Side effects:
// - Clears overrideSongId
// - Resolves song from playlist+seed
```

## Game Logic

### Song Selection
1. Admin configures game with seed and optional playlist
2. If overrideSongId set, use that song
3. Otherwise use randomSeed to select from playlist
4. Cache spotify and genius data on selection

### Gameplay Flow
1. User requests daily game
2. Backend:
   - Resolves song from config
   - Gets lyrics from cache
   - Computes masked lyrics from guesses
   - Returns game state
3. Frontend:
   - Shows masked lyrics
   - Handles guesses
   - Computes progress
   - Shows metadata when won

### Masking Rules
- All words (including "a", "the", etc) are replaced with underscores
- Numbers are also replaced with underscores
- All other characters are preserved exactly as they appear:
  - Punctuation (,.!? etc)
  - Special characters (@#$ etc)
  - Whitespace (including newlines)
  - Unicode characters
- Case-insensitive matching for guesses
- No partial word matches

### Progress Computation
- Progress shows percentage of all words found
- Win condition: find ALL words in both artist name AND song title
- Finding lyrics words doesn't affect win condition
- When won:
  1. Full song metadata revealed (artist, title, album, preview)
  2. Full lyrics revealed
  3. User can continue guessing lyrics for fun

## Security
- No sensitive data in client
- Admin routes protected by Next.js middleware
- Rate limiting: 1 guess per second
- Input sanitization for guesses
- Full lyrics only sent after win condition

## Error Handling
- Structured error responses
- Graceful degradation for API failures
- Retry mechanism for external APIs
- Error boundaries in React components

## Testing Strategy
- API route testing with Jest
- Integration tests for game logic
- Mock external APIs (Spotify, Genius)
- Test game completion scenarios

## Project Structure
```
src/
  app/                    # Next.js App Router
    api/                  # API Routes
    admin/               # Admin pages
    game/                # Game pages
    layout.tsx           # Root layout
    page.tsx             # Home page
  components/            # React components
    game/                # Game-specific components
    admin/               # Admin components
    ui/                  # Shared UI components
  lib/                   # Shared utilities
    spotify.ts           # Spotify API client
    genius.ts            # Genius API client
    cache.ts             # Caching logic
    game-logic.ts        # Core game logic
  prisma/                # Database schema
  types/                 # TypeScript types
  styles/               # Global styles
```

## Development Workflow
1. Use project generator for initial setup
2. Set up linting and formatting rules
3. Initialize Prisma schema and migrations
4. Implement core game logic
5. Build API routes
6. Develop frontend components
7. Add tests
8. Set up admin panel
9. Implement caching
10. Add monitoring and error handling 