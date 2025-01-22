# Fixtures Implementation Progress

## Current Structure
```
src/lib/test/
├── fixtures/
│   ├── spotify.ts     ✅ (exists)
│   ├── genius.ts      ✅ (exists)
│   ├── models.ts      ✅ (exists)
│   └── index.ts       ✅ (exists)
├── test-env/
│   ├── unit.ts        ✅ (exists)
│   ├── integration.ts ✅ (exists)
│   ├── db.ts         ✅ (exists)
│   └── environment.ts ✅ (exists)
└── utils/
    ├── fixtures.ts    ✅ (exists)
    └── index.ts       ✅ (exists)
```

## Step 1: Review & Update Existing Files

### 1.1 Fixtures
- [ ] Review `spotify.ts` content and update if needed
- [ ] Review `genius.ts` content and update if needed
- [ ] Review `models.ts` content and update if needed
- [ ] Update `index.ts` exports if needed

### 1.2 Test Environment
- [ ] Review `unit.ts` setup
- [ ] Review `integration.ts` setup
- [ ] Review mock implementations
- [ ] Ensure environment cleanup is working

## Step 2: Generator Script Enhancement
- [ ] Create/Update `scripts/generate-fixtures.ts`:
  ```typescript
  import { SpotifyApi } from '@spotify/web-api-ts-sdk';
  import { writeFileSync } from 'fs';
  import { join } from 'path';
  
  const SONGS = [
    {
      spotifyId: '5Q0Nhxo0l2bP3pNjpGJwV1', // Party in the U.S.A
      searchQuery: 'Party in the USA Miley Cyrus'
    },
    {
      spotifyId: '6gBFPUFcJLzWGx4lenP6h2', // ...Baby One More Time
      searchQuery: 'Baby One More Time Britney Spears'
    }
  ];

  async function generateFixtures() {
    const spotifyData = await getSpotifyData();
    const geniusData = await getGeniusData(spotifyData);
    
    await saveFixtures({
      spotify: spotifyData,
      genius: geniusData
    });
  }
  ```

## Step 3: Data Collection Implementation

### 3.1 Spotify Data
- [ ] Implement track fetching
- [ ] Implement search results fetching
- [ ] Add error handling
- [ ] Add rate limiting

### 3.2 Genius Data
- [ ] Implement lyrics fetching
- [ ] Implement search results fetching
- [ ] Add error handling
- [ ] Add rate limiting

## Step 4: Test Updates

### 4.1 Unit Tests
- [ ] Update `song.test.ts` to use fixtures
- [ ] Update `game.test.ts` to use fixtures
- [ ] Update `guess.test.ts` to use fixtures

### 4.2 Integration Tests
- [ ] Update `song.integration.test.ts`
- [ ] Update `game.integration.test.ts`
- [ ] Update `guess.integration.test.ts`

## Step 5: NPM Scripts
- [ ] Add/Update in `package.json`:
  ```json
  {
    "scripts": {
      "generate-fixtures": "ts-node scripts/generate-fixtures.ts",
      "pretest": "pnpm generate-fixtures"
    }
  }
  ```

## Progress Tracking

### Phase 1: Review & Update (Current)
- [ ] Review existing fixtures
- [ ] Review test environment
- [ ] Plan necessary updates

### Phase 2: Generator Enhancement
- [ ] Create/update generator script
- [ ] Implement data collection
- [ ] Add error handling

### Phase 3: Test Updates
- [ ] Update unit tests
- [ ] Update integration tests
- [ ] Verify all tests pass

## Notes
- We already have a good foundation with existing fixtures
- Focus on enhancing and maintaining current structure
- Ensure backward compatibility with existing tests
- Add proper error handling and validation 