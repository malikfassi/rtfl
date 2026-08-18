# GameState Data Evolution Analysis

## Executive Summary

This document traces the exact evolution of GameState data from backend creation through frontend consumption. Understanding this flow is crucial for building our simplified frontend architecture that trusts the backend's data processing.

## Data Flow Overview

```
Database → GameStateService → API Response → Frontend Hook → Component Props
```

## Stage 1: Database Storage

### Raw Data in Database
```sql
-- Song table stores pre-computed masked lyrics
Song {
  id: "clrqm6nkw001..."
  spotifyId: "4gMgiXfqyzZLMhsksGmbQV"
  lyrics: "I hopped off the plane at LAX..."  -- Raw lyrics text
  maskedLyrics: {                             -- Pre-computed Token arrays
    "title": [
      {"value": "Party", "isToGuess": true},
      {"value": " ", "isToGuess": false},
      {"value": "in", "isToGuess": true},
      {"value": " ", "isToGuess": false},
      {"value": "the", "isToGuess": true},
      {"value": " ", "isToGuess": false},
      {"value": "U", "isToGuess": true},
      {"value": ".", "isToGuess": false},
      {"value": "S", "isToGuess": true},
      {"value": ".", "isToGuess": false},
      {"value": "A", "isToGuess": true},
      {"value": ".", "isToGuess": false}
    ],
    "artist": [...],
    "lyrics": [...]
  }
}

-- Game links song to date
Game {
  id: "clrqm6nkw002..."
  date: "2025-01-25"
  songId: "clrqm6nkw001..."
}

-- Player guesses are stored per player
Guess {
  id: "clrqm6nkw003..."
  gameId: "clrqm6nkw002..."
  playerId: "clrqm6nkw004..."
  word: "party"
  valid: true
}
```

### Key Insight: Pre-computation
- **Lyrics are tokenized once** during song creation
- **isToGuess flags are set** based on regex `/\p{L}+|\p{N}+/gu`
- **Spacing and punctuation preserved** as non-guessable tokens
- **No runtime tokenization** - all processing done at write-time

## Stage 2: Backend Processing (GameStateService)

### Player-Specific State Generation
```typescript
// GameStateService.mapGameToGameState()
private mapGameToGameState(game: GameWithSongAndGuesses): GameState {
  // 1. Determine if player won the game
  const isWon = this.isGameWon(game.song, game.guesses);
  
  // 2. Get player's valid guessed words
  const guessedWords = new Set(
    game.guesses.filter(g => g.valid).map(g => g.word.toLowerCase())
  );
  
  // 3. Apply player-specific masking
  function maskTokens(tokens: Token[]): Token[] {
    return tokens.map(token => {
      if (!token.isToGuess) return token; // Keep spaces/punctuation
      
      // Show word if game won OR word was guessed
      if (isWon || guessedWords.has(token.value.toLowerCase())) {
        return token; // Original word
      }
      
      // Otherwise mask with underscores
      return { ...token, value: '_'.repeat(token.value.length) };
    });
  }
  
  // 4. Return player-specific state
  return {
    id: game.id,
    date: game.date,
    masked: {
      title: maskTokens(masked.title),
      artist: maskTokens(masked.artist), 
      lyrics: maskTokens(masked.lyrics)
    },
    guesses: game.guesses, // Only this player's guesses
    song: isWon ? songData : undefined // Full song data if won
  };
}
```

### Win Condition Logic
```typescript
// Two win conditions (OR logic)
private isGameWon(song: Song, guesses: Guess[]): boolean {
  const validWords = new Set(guesses.filter(g => g.valid).map(g => g.word.toLowerCase()));
  
  // Count guessed vs total tokens
  const titleArtistGuessed = [...title, ...artist]
    .filter(t => t.isToGuess && validWords.has(t.value.toLowerCase())).length;
  const lyricsGuessed = lyrics
    .filter(t => t.isToGuess && validWords.has(t.value.toLowerCase())).length;
    
  const totalTitleArtist = [...title, ...artist].filter(t => t.isToGuess).length;
  const totalLyrics = lyrics.filter(t => t.isToGuess).length;
  
  // Win if: 80% lyrics OR 100% title+artist
  return (lyricsGuessed >= totalLyrics * 0.8) || 
         (titleArtistGuessed >= totalTitleArtist);
}
```

### Key Insight: Dynamic Masking
- **Same base tokens** used for all players
- **Player-specific masking** applied based on their guesses
- **Win state affects all tokens** - if won, all words revealed
- **Individual word reveals** - guessed words shown even if not won

## Stage 3: API Response Structure

### Typical API Response
```json
{
  "id": "clrqm6nkw002...",
  "date": "2025-01-25",
  "masked": {
    "title": [
      {"value": "Party", "isToGuess": true},    // Player guessed "party"
      {"value": " ", "isToGuess": false},
      {"value": "__", "isToGuess": true},       // Player hasn't guessed "in"
      {"value": " ", "isToGuess": false},
      {"value": "___", "isToGuess": true},      // Player hasn't guessed "the"
      {"value": " ", "isToGuess": false},
      {"value": "U", "isToGuess": true},        // Player guessed "u"
      {"value": ".", "isToGuess": false},
      {"value": "S", "isToGuess": true},        // Player guessed "s"  
      {"value": ".", "isToGuess": false},
      {"value": "A", "isToGuess": true},        // Player guessed "a"
      {"value": ".", "isToGuess": false}
    ],
    "artist": [...],
    "lyrics": [...]
  },
  "guesses": [
    {"id": "...", "word": "party", "valid": true, "createdAt": "..."},
    {"id": "...", "word": "u", "valid": true, "createdAt": "..."},
    {"id": "...", "word": "s", "valid": true, "createdAt": "..."},
    {"id": "...", "word": "a", "valid": true, "createdAt": "..."},
    {"id": "...", "word": "wrong", "valid": false, "createdAt": "..."}
  ],
  "song": undefined  // Only present if game won
}
```

### Key Insight: Ready-to-Render Data
- **Tokens are pre-masked** with correct underscore lengths
- **isToGuess flags preserved** for frontend logic
- **Spacing/punctuation intact** for proper rendering
- **No frontend masking needed** - just display token values

## Stage 4: Frontend Data Consumption

### usePlayer Hook (Data Fetching)
```typescript
// Direct API consumption - no transformation
const playerApi = {
  getCurrentGame: async (userId: string, date: string): Promise<GameState | null> => {
    const response = await fetch(`/api/games/${date}`, {
      headers: { 'x-user-id': userId }
    });
    return response.json(); // Direct return - no processing
  }
};

export function useGameState(userId: string, date: string) {
  return useQuery({
    queryKey: [...queryKeys.games.byDate(date), userId],
    queryFn: () => playerApi.getCurrentGame(userId, date)
  });
}
```

### useGameLogic Hook (Data Processing)
```typescript
export function useGameLogic({ date }: GameLogicProps): FrontendGameState {
  // 1. Get raw GameState from API
  const { data: currentGame } = useGameState(playerId, date);
  
  // 2. Convert token arrays to display strings (legacy compatibility)
  const maskedTitle = Array.isArray(currentGame?.masked?.title)
    ? currentGame.masked.title.map(part => part.value).join('')
    : '';
    
  // 3. Keep original token arrays for component logic
  const maskedTitleParts = currentGame?.masked?.title;
  
  // 4. Calculate derived state
  const foundWords = currentGame?.guesses
    ?.filter(g => g.valid)
    .map(g => g.word.toLowerCase()) || [];
    
  // 5. Return both formats for compatibility
  return {
    currentGame,           // Raw API response
    maskedTitle,          // String format
    maskedTitleParts,     // Token array format
    foundWords,           // Derived data
    // ... other computed state
  };
}
```

### Key Insight: Dual Data Formats
- **Raw GameState** passed through unchanged
- **String conversion** for legacy component compatibility
- **Token arrays** preserved for new simplified components
- **Derived state** computed from raw data

## Stage 5: Component Consumption

### Current Complex Approach
```typescript
// Multiple data transformations in components
const MaskedLyrics = ({ maskedLyricsParts, foundWords, ... }) => {
  // Component does its own word state calculations
  const wordStates = calculateWordStates(maskedLyricsParts, foundWords);
  
  // Component handles highlighting logic
  const isHighlighted = (token) => {
    // Complex logic to determine if word should be highlighted
  };
  
  return (
    <div>
      {maskedLyricsParts.map(token => (
        <span className={getWordClass(token, wordStates)}>
          {token.value}
        </span>
      ))}
    </div>
  );
};
```

### Simplified Approach (Target)
```typescript
// Trust backend data completely
const MaskedLyricsDisplay = ({ 
  maskedLyricsParts, 
  highlightedWord, 
  scrollToWord 
}) => {
  return (
    <div>
      {maskedLyricsParts.map(token => (
        <span 
          key={token.id}
          className={token.isToGuess ? 'guessable' : 'static'}
          data-word={token.isToGuess ? token.value : undefined}
          data-highlighted={highlightedWord === token.value}
          data-scroll-target={scrollToWord === token.value}
        >
          {token.value}
        </span>
      ))}
    </div>
  );
};
```

## Critical Data Evolution Insights

### 1. Backend Does All Business Logic
- **Masking algorithm** - server-side only
- **Win condition calculation** - server-side only  
- **Word validation** - server-side only
- **Progress tracking** - server-side only

### 2. Frontend Receives Ready-to-Render Data
- **Pre-masked tokens** with correct underscore lengths
- **isToGuess flags** for styling/interaction
- **Preserved formatting** (spaces, punctuation)
- **Player-specific state** already computed

### 3. Token Structure is Consistent
```typescript
interface Token {
  value: string;      // Display value (word or underscores)
  isToGuess: boolean; // Whether this token is interactive
}
```

### 4. State Evolution Pattern
```
Raw Lyrics → Tokenization → Pre-computation → Player Masking → Frontend Display
    ↓              ↓              ↓               ↓              ↓
"Party in"  → [{Party,T},{' ',F}] → Stored → [{Party,T},{' ',F}] → "Party "
                                      ↓              ↓              ↓
                              Player hasn't  → [{'_____',T},{' ',F}] → "_____ "
                              guessed yet
```

## Implications for Frontend Simplification

### 1. Remove Frontend Masking Logic
- **No calculateWordState()** - backend provides final state
- **No frontend win detection** - backend provides song data when won
- **No frontend progress calculation** - derive from backend data

### 2. Simplify Component Props
- **Use token arrays directly** from backend
- **Minimal derived state** in components
- **Trust isToGuess flags** for all logic

### 3. Clean Data Flow
```
API Response → Component Props (no transformation)
```

### 4. Component Responsibilities
- **Display tokens** as provided by backend
- **Handle UI interactions** (hover, click)
- **Trigger guess submissions** to backend
- **React to backend state changes**

## Example: Perfect Data Flow

### Backend Response
```json
{
  "masked": {
    "lyrics": [
      {"value": "I", "isToGuess": true},
      {"value": " ", "isToGuess": false},
      {"value": "______", "isToGuess": true},
      {"value": " ", "isToGuess": false},
      {"value": "off", "isToGuess": true}
    ]
  }
}
```

### Frontend Component
```typescript
const MaskedLyricsDisplay = ({ maskedLyricsParts }) => (
  <div>
    {maskedLyricsParts.map((token, i) => (
      <span 
        key={i}
        className={token.isToGuess ? 'word' : 'space'}
      >
        {token.value}
      </span>
    ))}
  </div>
);
```

### Result
```html
<div>
  <span class="word">I</span>
  <span class="space"> </span>
  <span class="word">______</span>
  <span class="space"> </span>
  <span class="word">off</span>
</div>
```

## Conclusion

The backend provides a complete, player-specific game state that requires **zero business logic processing** in the frontend. The frontend's job is purely presentational:

1. **Display tokens** exactly as provided
2. **Handle user interactions** (hover, click, scroll)
3. **Submit guesses** to backend
4. **React to state updates** from backend

This understanding enables our frontend simplification by eliminating all the complex state management, word calculation, and masking logic that currently exists in the frontend components.

The key insight: **Trust the backend completely** - it provides ready-to-render data that requires no transformation or additional processing.
