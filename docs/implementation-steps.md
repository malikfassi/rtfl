# Implementation Steps

## 1. Database Schema Updates
- [x] Update Song model
  - [x] Replace title/artist/previewUrl with spotifyData JSON
  - [x] Add geniusData JSON
  - [x] Update maskedLyrics structure for better word tracking
- [x] Create Guess model
  - [x] Basic fields (id, gameId, playerId, word, createdAt)
  - [x] Add unique constraint for [gameId, playerId, word]
- [x] Run migrations

## 2. Core Services

### WordService (New)
- [ ] Create service for word processing
  - [ ] Extract words from text (lyrics/title/artist)
  - [ ] Word normalization (case, punctuation)
  - [ ] Word masking logic
  - [ ] Word matching logic

### GuessService (New)
- [ ] Create base service structure
- [ ] Implement word validation
  - [ ] Case insensitive matching
  - [ ] Exact word matching
  - [ ] No partial matches
- [ ] Implement submitGuess method
  - [ ] Check for duplicate guesses
  - [ ] Match against song data
  - [ ] Store guess in database
- [ ] Implement getPlayerGuesses method

### GameService Updates
- [ ] Add player-specific methods
  - [ ] getGameForPlayer(date, playerId)
  - [ ] getPlayerProgress(gameId, playerId)
- [ ] Implement game winning logic
  - [ ] Calculate lyrics guess percentage
  - [ ] Check title/artist completion
  - [ ] Return full song data if won

## 3. API Routes

### Admin Routes (Existing)
- [x] /api/admin/games
  - [x] GET - List games by month
  - [x] POST - Create/update game
  - [x] DELETE - Delete game
- [x] /api/admin/games/[date]
  - [x] GET - Get game details
  - [x] POST - Update game
- [x] /api/admin/spotify/*
  - [x] Playlist management
  - [x] Track management

### Player Routes (New)
- [ ] /api/games
  - [ ] GET ?date=YYYY-MM-DD
    - Get masked game data
    - Get player's guesses
    - Return full song if won
  - [ ] GET ?month=YYYY-MM
    - List available games for month
    - Include player's progress
- [ ] /api/games/[gameId]/guesses
  - [ ] POST
    - Submit new guess
    - Return guess result
    - Return updated game state
  - [ ] GET
    - Get player's guess history
    - Include game progress

## 4. React Hooks & Components

### Admin Components (Existing)
- [x] AdminDashboard
- [x] GameEditor
- [x] Calendar
- [x] PlaylistBrowser

### Player Components (New)
- [ ] Update GameInterface.tsx
  - [ ] Connect to new hooks
  - [ ] Show masked lyrics
  - [ ] Show guess history
  - [ ] Show game progress
  - [ ] Handle game completion

### Admin Hooks (Existing)
- [x] useGame
- [x] useGames
- [x] useGameMutations

### Player Hooks (New)
- [ ] usePlayerGame(date)
  - [ ] Fetch game data
  - [ ] Handle player state
  - [ ] Track game progress
- [ ] useGuess(gameId)
  - [ ] Submit guesses
  - [ ] Track guess history
  - [ ] Handle errors

## 5. Testing

### Unit Tests
- [ ] WordService tests
  - [ ] Word extraction
  - [ ] Word masking
  - [ ] Word matching
- [ ] GuessService tests
  - [ ] Guess validation
  - [ ] Guess submission
  - [ ] Progress tracking
- [ ] GameService player method tests
  - [ ] Player progress
  - [ ] Game winning conditions

### Integration Tests
- [ ] Player API endpoint tests
- [ ] Full game flow tests
  - [ ] Multiple guesses
  - [ ] Progress tracking
  - [ ] Game completion

## Notes
- Start with core word processing logic
- Build services before API routes
- Write tests alongside implementation
- Keep error handling consistent
- Maintain clear separation between admin and player features 