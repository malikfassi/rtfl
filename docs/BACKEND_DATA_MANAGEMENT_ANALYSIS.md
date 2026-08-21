# Backend Data Management Analysis

## Executive Summary

The backend follows a well-structured layered architecture with clear separation of concerns. Data flows from external APIs (Spotify, Genius) through services that process and store data, then serves it to the frontend through RESTful APIs. The system uses a sophisticated masking algorithm and player-specific game states.

## Architecture Overview

### Core Components

1. **Database Layer** (Prisma + SQLite)
   - `Song`: Stores track metadata, lyrics, and pre-computed masked lyrics
   - `Game`: Links songs to specific dates
   - `Guess`: Tracks player guesses with validation

2. **Service Layer** 
   - `GameStateService`: Manages player-specific game states
   - `SongService`: Handles song creation and external API integration
   - `GuessService`: Validates and stores player guesses
   - `MaskedLyricsService`: Processes lyrics into guessable tokens

3. **API Layer**
   - Player APIs: `/api/games/*` - Public game access
   - Admin APIs: `/api/admin/*` - Game management
   - Middleware: User ID injection, validation

## Data Flow Architecture

### 1. Song Creation Flow
```
Admin creates game → SongService.create() → Spotify API → Genius API → LyricsService → MaskedLyricsService → Database
```

**Key Points:**
- Songs are created once and reused across games
- Lyrics are processed into tokens with `isToGuess` flags
- Pre-computed masked lyrics stored as JSON in database
- External API data cached for performance

### 2. Game State Flow
```
Player requests game → GameStateService.getGameState() → Database query → Token masking → Player-specific state
```

**Key Points:**
- Each player sees different masked state based on their guesses
- Win conditions calculated server-side (80% lyrics OR 100% title/artist)
- Masked tokens dynamically revealed based on player progress

### 3. Guess Submission Flow
```
Player submits guess → GuessService.submitGuess() → Validation → Database storage → Updated game state
```

**Key Points:**
- Duplicate guess prevention
- Server-side word validation against masked lyrics
- Immediate feedback with updated game state

## Data Models

### Database Schema

```sql
Song {
  id: String (CUID)
  spotifyId: String
  spotifyData: Json        // Cached Spotify track data
  geniusData: Json         // Cached Genius song data  
  lyrics: String           // Raw lyrics text
  maskedLyrics: Json       // Pre-computed Token arrays
}

Game {
  id: String (CUID)
  date: String (YYYY-MM-DD)
  songId: String
}

Guess {
  id: String (CUID)
  gameId: String
  playerId: String
  word: String
  valid: Boolean
}
```

### Key Data Structures

#### Token Structure
```typescript
interface Token {
  value: string;      // The actual word/text
  isToGuess: boolean; // Whether this token is guessable
}
```

#### MaskedLyrics Structure
```typescript
interface MaskedLyrics {
  title: Token[];   // Tokenized song title
  artist: Token[];  // Tokenized artist name
  lyrics: Token[];  // Tokenized lyrics text
}
```

#### GameState Structure
```typescript
interface GameState {
  id: string;
  date: string;
  masked: MaskedLyrics;    // Player-specific masked state
  guesses: Guess[];        // Player's guesses only
  song?: {                 // Only present when game is won
    title: string;
    artist: string;
    lyrics: string;
  };
}
```

## Core Algorithms

### 1. Lyrics Tokenization
**Location:** `MaskedLyricsService.processText()`

- Uses Unicode regex `/\p{L}+|\p{N}+/gu` to identify words
- Preserves all punctuation and spacing as non-guessable tokens
- Creates balanced token arrays for accurate reconstruction

### 2. Dynamic Masking
**Location:** `GameStateService.maskTokens()`

- Checks if game is won OR specific word is guessed
- Masks unguessed words with underscores matching length
- Preserves original token structure for frontend rendering

### 3. Win Condition Logic
**Location:** `GameStateService.isGameWon()`

- **Lyrics Win:** 80% of lyrics tokens guessed
- **Title/Artist Win:** 100% of title AND artist tokens guessed
- Uses Set-based comparison for efficient lookup

### 4. Guess Validation
**Location:** `GuessService.submitGuess()`

- Normalizes guess to lowercase
- Prevents duplicate guesses per player
- Validates against all masked lyrics sections (title, artist, lyrics)

## API Design Patterns

### RESTful Structure
```
GET  /api/games/{date}           # Get game state
POST /api/games/{date}/guess     # Submit guess
GET  /api/games/month/{month}    # Get month games

GET  /api/admin/games/{date}     # Admin: Get game
POST /api/admin/games/{date}     # Admin: Create/update game
```

### Response Patterns
- **Success:** Direct data return
- **Error:** Structured error objects with codes
- **Validation:** Zod schema validation throughout
- **Headers:** User ID injection via middleware

### Data Consistency
- Player ID generated client-side, validated server-side
- Game states are player-specific but derived from shared data
- Atomic guess submission with immediate state update

## Performance Optimizations

### 1. Pre-computation
- Masked lyrics calculated once during song creation
- Expensive tokenization done at write-time, not read-time
- External API data cached in database

### 2. Efficient Queries
- Indexed database queries on date, player ID, game ID
- Single query fetches game with song and player guesses
- Minimal data transfer with targeted projections

### 3. Smart Caching
- React Query handles frontend caching
- Database connection pooling
- Static fixture data for testing

## Security & Validation

### Input Validation
- Zod schemas for all API inputs
- Date format validation (YYYY-MM-DD)
- Player ID format validation (CUID)
- Guess word sanitization

### Data Isolation
- Player-specific game states
- No cross-player data leakage
- Admin APIs separate from player APIs

### Error Handling
- Structured error hierarchy
- Graceful degradation (rickroll fallback)
- Comprehensive error logging

## Integration Points

### External APIs
1. **Spotify Web API**
   - Track search and metadata
   - Cached responses in database
   - Rate limiting and error handling

2. **Genius API**
   - Song search and lyrics fetching
   - HTML parsing for clean lyrics
   - Fallback mechanisms

### Frontend Integration
- Clean JSON APIs with TypeScript types
- Consistent error response format
- Real-time state updates via React Query

## Data Consistency Rules

### 1. Song-Game Relationship
- One song can power multiple games (different dates)
- Games always have exactly one song
- Songs are immutable once created

### 2. Player-Game Relationship
- Each player has independent game state
- Guesses are player-specific
- Win conditions calculated per player

### 3. Guess Validation Rules
- Case-insensitive matching
- No duplicate guesses per player
- Words must exist in masked lyrics
- Immediate validation feedback

## Scalability Considerations

### Current Architecture
- SQLite suitable for current scale
- Single-instance deployment
- In-memory processing

### Future Scaling Options
- PostgreSQL for multi-instance deployment
- Redis for session management
- Horizontal scaling of API layer

## Key Strengths

1. **Clean Architecture:** Clear separation of concerns
2. **Type Safety:** End-to-end TypeScript with runtime validation
3. **Performance:** Pre-computed data, efficient queries
4. **Testability:** Comprehensive fixture-based testing
5. **Maintainability:** Well-documented, consistent patterns

## Areas for Improvement

1. **Caching:** Could add Redis for better performance
2. **Monitoring:** Need better observability and metrics
3. **Rate Limiting:** External API usage could be optimized
4. **Backup Strategy:** Database backup and recovery procedures

## Testing Strategy

### Unit Tests
- Service layer logic with mocked dependencies
- Validation schemas and edge cases
- Algorithm correctness (masking, win conditions)

### Integration Tests
- End-to-end API workflows
- Database operations with real data
- External API integration with fixtures

### Fixture-Driven Testing
- Consistent test data across all layers
- Real-world song examples
- Comprehensive edge case coverage

## Conclusion

The backend demonstrates solid engineering practices with a clean, scalable architecture. The data flow is well-designed for the game mechanics, with efficient algorithms and proper separation of concerns. The system successfully handles the complexity of player-specific game states while maintaining data consistency and performance.

The architecture supports the frontend simplification goals by providing clean, predictable APIs that handle all business logic server-side, allowing the frontend to focus purely on presentation and user interaction. 