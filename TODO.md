# Code Architecture
- Add pure genius client (should only do requests to genius API)
- Extract domain logic in LyricsService
- Consolidate type definitions across tests, API, and front-end
- Consolidate word matching logic

# Testing Infrastructure
## Test Data Generation

- Generator should fetch all requests we do in our codebase:
  - Spotify SDK calls
  - Genius API calls
  - Store raw JSON responses

## Test Data Organization
- Create fixtures object to read JSON files and return typed responses
- Use fixtures to mock services responses and inputs
- Use fixtures to validate service outputs:
  - Unit tests: exact match validation
  - Integration tests: validate critical fields only
  - Example: compare lyrics from fixtures with service response

## Test Setup Helpers
- Add helpers to set up test data:
  - Create game before guess tests
  - Use consistent player IDs across tests
- Create DB seeding script for local tests using fixtures

# API Features
## Stats Endpoints
### User Stats (`/user/:id/stats`)
```typescript
{
  bestStreak: number,
  totalGames: number,
  totalGuesses: number,
  totalHits: number,
  totalMisses: number,
  totalGamesWon: number
}
```

### Daily Game Stats (`/:date/stats`)
```typescript
{
  totalPlayers: number,
  totalGuesses: number,
  totalGamesWon: number,
  maskedWordStats: {
    [word: string]: number  // percentage of people who guessed each word
  }
}
```

# Admin Features
- Fix single and batch game editor
- Add stats to admin page

# Frontend Improvements
- Fix progress bar
- Fix archive page
- Prevent accessing/playing future games

# Deployment
- Setup deployment pipeline
- prevent /admin admin from users

-> type games