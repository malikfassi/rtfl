# Phase 2 Progress Tracking - Core Infrastructure

## 1. Database Setup
- [ ] Initialize Prisma with SQLite
  ```bash
  pnpm add -D prisma
  pnpm add @prisma/client
  pnpm prisma init
  ```
  ✓ Verify:
  - [ ] prisma/schema.prisma created
  - [ ] .env updated with DATABASE_URL

- [ ] Create Database Models
  - [ ] GameConfig model
    - [ ] id: String (UUID)
    - [ ] date: DateTime (unique)
    - [ ] randomSeed: String
    - [ ] playlistId: String
    - [ ] overrideSongId: String?
    - [ ] createdAt/updatedAt: DateTime
  - [ ] Cache tables
    - [ ] CachedSpotifyTrack (with full track data as JSON)
    - [ ] CachedSpotifyPlaylist (with playlist metadata + tracks)
    - [ ] CachedGeniusLyrics (with original lyrics text)
  - [ ] Guess model
    - [ ] id: String (UUID)
    - [ ] userId: String
    - [ ] gameConfigId: String
    - [ ] word: String
    - [ ] timestamp: DateTime

- [ ] Database Setup Tasks
  - [ ] Create initial migration
  - [ ] Apply migration
  - [ ] Generate Prisma Client
  - [ ] Add seed data script
  - [ ] Test database connections
  - [ ] Set up SQLite database file location

## 2. External Services Layer
- [ ] Spotify API Client
  - [ ] Authentication setup
  - [ ] Playlist search
  - [ ] Track fetching
  - [ ] Error handling
  - [ ] Rate limiting
  - [ ] Type safety with SDK
  - [ ] Retry mechanism for API failures

- [ ] Genius API Client
  - [ ] Authentication setup
  - [ ] Lyrics fetching
  - [ ] Search functionality
  - [ ] Error handling
  - [ ] Rate limiting
  - [ ] Retry mechanism for API failures

- [ ] Service Tests
  - [ ] Mock external APIs
  - [ ] Test error scenarios
  - [ ] Test rate limiting
  - [ ] Test data transformations
  - [ ] Test retry mechanisms

## 3. Cache Service
- [ ] Cache Implementation
  - [ ] Cache invalidation logic
  - [ ] TTL configuration
  - [ ] Error handling
  - [ ] Cache refresh strategy
  - [ ] Graceful degradation on cache miss

- [ ] Cache Tables
  - [ ] Spotify track caching (full track data)
  - [ ] Playlist caching (metadata + tracks)
  - [ ] Lyrics caching (original text)
  - [ ] Cache cleanup jobs
  - [ ] Cache update timestamps

- [ ] Cache Tests
  - [ ] Test invalidation
  - [ ] Test refresh
  - [ ] Test concurrent access
  - [ ] Test error recovery
  - [ ] Test cache miss scenarios

## 4. Game Logic Service
- [ ] Core Game Logic
  - [ ] Song selection algorithm
  - [ ] Random seed handling
  - [ ] Word masking rules (including special characters)
  - [ ] Progress calculation (80% completion)
  - [ ] Win condition checking
  - [ ] Case-insensitive word matching
  - [ ] Special character preservation
  - [ ] No partial word matches

- [ ] Game State Management
  - [ ] State transitions
  - [ ] Progress tracking
  - [ ] History recording
  - [ ] User session handling
  - [ ] Rate limiting (1 guess/second)
  - [ ] Anonymous user handling (UUID)

- [ ] Game Logic Tests
  - [ ] Test song selection
  - [ ] Test word masking
  - [ ] Test win conditions
  - [ ] Test edge cases
  - [ ] Test rate limiting
  - [ ] Test special characters
  - [ ] Test case sensitivity

## 5. Integration Tests
- [ ] Test Scenarios
  - [ ] Full game flow
  - [ ] Cache interactions
  - [ ] External API fallbacks
  - [ ] Error recovery
  - [ ] Rate limit handling
  - [ ] Anonymous user flow
  - [ ] Game completion flow
  - [ ] Data persistence

## Final Checklist
- [ ] All services working together
- [ ] Error handling in place
- [ ] Rate limiting configured (1/second)
- [ ] Cache working efficiently
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Graceful degradation implemented
- [ ] Input sanitization working
- [ ] Error boundaries configured

## Dependencies to Add
```bash
# Database
pnpm add @prisma/client
pnpm add -D prisma

# API Clients (already have Spotify SDK)
pnpm add axios

# Testing
pnpm add -D jest @types/jest ts-jest
pnpm add -D @testing-library/react @testing-library/jest-dom

# Utilities
pnpm add date-fns uuid zod
pnpm add -D @types/uuid
``` 