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

## Game Logic

### Game State Management
1. Word Masking
   - Replace letters and numbers with underscores
   - Preserve special characters and whitespace
   - Handle case-insensitive matching
   - No partial word matches

2. Progress Tracking
   - Track revealed words
   - Calculate completion percentage
   - Handle win condition (title + artist complete)
   - Show full lyrics at 80% completion

3. State Computation
   - Compute masked content from guesses
   - Track guess history
   - Handle state transitions
   - Validate win conditions

### Admin Operations
1. Game Configuration
   - Create game configs with date, seed, playlist
   - Optional song override
   - Update existing configs

2. Song Resolution
   - Use override song if specified
   - Otherwise select from playlist using seed
   - Cache song data on selection
   - Cache lyrics data on selection

3. Playlist Management
   - Search Spotify playlists
   - Cache playlist data
   - Update game config playlists
   - Handle song overrides

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