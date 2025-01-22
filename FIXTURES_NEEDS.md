# Test Fixtures Needs

## 1. Mock Songs Data

### Spotify Track Data
```typescript
interface SpotifyTrack {
  id: string;
  name: string;
  preview_url: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    images: Array<{
      url: string;
      width: number;
      height: number;
    }>;
  };
}

// Example: "Party in the U.S.A" by Miley Cyrus
const partyInTheUSA: SpotifyTrack = {
  id: "5Q0Nhxo0l2bP3pNjpGJwV1",
  name: "Party in the U.S.A.",
  preview_url: "https://p.scdn.co/mp3-preview/...",
  artists: [{
    id: "5YGY8feqx7naU7z4HrwZM6",
    name: "Miley Cyrus"
  }],
  album: {
    images: [{
      url: "https://i.scdn.co/image/...",
      width: 640,
      height: 640
    }]
  }
};

// Example: "...Baby One More Time" by Britney Spears
const babyOneMoreTime: SpotifyTrack = {
  // Similar structure
};
```

### Genius Song Data
```typescript
interface GeniusData {
  title: string;
  artist_names: string;
  lyrics: string;
}

const partyInTheUSALyrics: GeniusData = {
  title: "Party in the U.S.A.",
  artist_names: "Miley Cyrus",
  lyrics: "I hopped off the plane at L.A.X...",
};

const babyOneMoreTimeLyrics: GeniusData = {
  // Similar structure
};
```

## 2. Game Data

### Game Models
```typescript
interface Game {
  id: string;
  date: string;  // YYYY-MM-DD
  songId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Example games for different dates
const games = {
  today: {
    id: "game1",
    date: "2024-03-20",
    songId: "song1",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  tomorrow: {
    // Similar structure
  }
};
```

### Guess Models
```typescript
interface Guess {
  id: string;
  gameId: string;
  playerId: string;
  word: string;
  createdAt: Date;
}

// Example guesses for testing
const guesses = {
  valid: {
    id: "guess1",
    gameId: "game1",
    playerId: "player1",
    word: "party",
    createdAt: new Date()
  },
  invalid: {
    // Similar structure with invalid word
  }
};
```

## 3. Required Test Cases

### Song Creation Tests
- Create song with valid Spotify track
- Handle missing preview URL
- Handle missing album images
- Handle missing artist data

### Game Management Tests
- Create game for specific date
- Update existing game
- Get game by date
- Get games by month

### Guess Submission Tests
- Submit valid word from lyrics
- Submit valid word from title
- Submit valid word from artist
- Handle duplicate guesses
- Handle invalid words

## 4. Implementation Steps

1. Create base test data:
   ```typescript
   // src/lib/test/fixtures/spotify.ts
   export const spotifyData = {
     tracks: {
       partyInTheUSA,
       babyOneMoreTime
     }
   };

   // src/lib/test/fixtures/genius.ts
   export const geniusData = {
     partyInTheUSA: partyInTheUSALyrics,
     babyOneMoreTime: babyOneMoreTimeLyrics
   };
   ```

2. Create test helpers:
   ```typescript
   // src/lib/test/utils/test-helpers.ts
   export const getTestSong = (key: string) => ({
     spotifyData: spotifyData.tracks[key],
     geniusData: geniusData[key]
   });

   export const SONG_KEYS = {
     PARTY_IN_THE_U_S_A: 'partyInTheUSA',
     BABY_ONE_MORE_TIME: 'babyOneMoreTime'
   };
   ```

3. Create mock clients:
   ```typescript
   // src/lib/test/mocks/spotify.ts
   export class SpotifyClientMock {
     getTrack = jest.fn();
     searchTracks = jest.fn();
   }

   // src/lib/test/mocks/genius.ts
   export class GeniusClientMock {
     searchSong = jest.fn();
   }
   ```

4. Setup test environments:
   ```typescript
   // src/lib/test/test-env/unit.ts
   export const setupUnitTest = () => ({
     mockPrisma,
     mockSpotifyClient,
     mockGeniusClient
   });
   ``` 