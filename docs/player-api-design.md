# Player API Design

## Data Model

### Guess
Simple model to track player guesses:
```prisma
model Guess {
  id        String   @id @default(cuid())
  gameId    String   // Reference to the game
  playerId  String   // Anonymous ID from localStorage
  word      String   // The guessed word
  createdAt DateTime @default(now())

  @@unique([gameId, playerId, word]) // Prevent duplicate guesses
}
```

## API Endpoints

### 1. Get Game
```typescript
GET /api/games/:date

Response {
  id: string
  date: string
  masked: {
    title: string[]      // Masked title words with revealed correct guesses    
    artist: string[]     // Masked artist words with revealed correct guesses
    lyrics: string[]     // Masked lyrics words with revealed correct guesses
  },
  guesses: Guess[],
  song: spotifyData, // if game is won
}
```

PrismaSong:
```prisma
model Song {
  id           String   @id @default(cuid())
  spotifyId    String   @unique
  lyrics       String 
  geniusData   Json //store all genius data from the api response
  spotifyData  Json //store all spotify data from tracks/:id
  maskedLyrics Json
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  games        Game[]

  @@index([spotifyId])
}
```

// game is won if 80% of lyrics are guessed or 100% of title and artist are guessed



### 2. Submit Guess
```typescript
POST /api/games/:gameId/guesses

Request {
  playerId: string  // From localStorage
  word: string      // Word to guess
}

Response {
  correct: boolean  // Whether word exists in song
  word: string      // The guessed word
}
```

### 3. Get Player Guesses
```typescript
GET /api/games/:gameId/guesses?playerId=:playerId

Response {
  guesses: {
    word: string
    createdAt: string
  }[]
}
```

## Business Logic

### Word Matching
- Words are matched against the song's:
  - Title
  - Artist name
  - Lyrics
- Case insensitive matching
- Must be exact word matches (no partial matches)
- Each word can only be guessed once per player per game

### Word Masking
- Non-guessed words are masked with underscores (_)
- Word length is preserved
- Spaces and punctuation are preserved

### Player Identification
- Players are identified by a random ID stored in localStorage
- No authentication required
- No personal data stored

## Error Handling

Simple error responses:
```typescript
{
  error: string  // Human readable error message
  code: 'INVALID_WORD' | 'DUPLICATE_GUESS' | 'GAME_NOT_FOUND'
}
``` 