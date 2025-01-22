# Test Data Structure

## Progress Tracker

### ✅ Phase 1: Data Generation
- Created generator script with error handling
- Implemented Spotify API data fetching
- Implemented Genius API data fetching
- Added proper typing from SDK

### ✅ Phase 2: Directory Structure
- Organized test data into clear categories:
  - `fixtures/responses/` for API responses
  - `fixtures/models/` for our data models
  - `utils/mocks/` for mock clients
  - `utils/` for shared utilities

### ✅ Phase 3: Test File Refactoring
- Created utility functions for test data access
- Updated test files to use new structure
- Standardized patterns across tests
- Removed old mocks directory

### 🔄 Phase 4: Final Cleanup
- [ ] Remove any remaining old files
- [ ] Update documentation
- [ ] Add data validation utilities
- [ ] Consider adding snapshot tests

## Current Test Data Structure

### 1. Test Data Organization
```typescript
// Test data is organized into three main categories:
import { 
  // 1. Our domain models
  modelData,   // Record of Song, Game models
  
  // 2. External API responses
  spotifyData, // Record of Spotify API responses
  geniusData,  // Record of Genius API responses
  
  // 3. Utility functions
  getTestSong,
  getTestGame,
  getTestGameWithSong
} from '@/lib/test';
```

### 2. Mock Clients
```typescript
import { 
  SpotifyClientMock,
  GeniusClientMock 
} from '@/lib/test';

// Mock clients use actual response data:
const spotifyClient = new SpotifyClientMock();
const track = await spotifyClient.getTrack('...');
```

## Best Practices

### Data Access
✅ DO:
```typescript
import { getTestSong, SONG_KEYS } from '@/lib/test';

const song = getTestSong(SONG_KEYS.PARTY_IN_THE_U_S_A_);
```

❌ DON'T:
```typescript
// Don't create test data manually
const song = {
  id: '123',
  spotifyId: '456',
  // ...more properties
};
```

### Type Safety
✅ DO:
```typescript
import { spotifyData } from '@/lib/test';
import type { SpotifyTrack } from '@/types/spotify';

// Types are preserved from SDK
const track: SpotifyTrack = spotifyData.tracks.PARTY_IN_THE_U_S_A_;
```

### JSON Handling
✅ DO:
```typescript
import { toInputJsonValue } from '@/lib/test';

// Convert complex objects to JsonValue
const data = toInputJsonValue({ date: new Date() });
```

## Next Steps

### Immediate Actions
1. Add data validation utilities
2. Consider adding snapshot tests
3. Add more test cases to fixtures

### Future Improvements
1. Add more songs to test data
2. Implement playlist fixtures
3. Add error response fixtures