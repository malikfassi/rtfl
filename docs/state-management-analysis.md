# State Management and Component Structure Analysis

## Current Issues

### State Management Issues
1. Multiple sources of truth between `pendingChanges` and `games` state
2. Complex state management in Calendar for drag selection
3. Tightly coupled song selection and calendar state
4. Inconsistent state updates across components
5. Mix of local state and global state management

### Architecture Issues
1. Scattered API logic across components and hooks
2. Inconsistent data fetching patterns
3. Complex component dependencies
4. Duplicated business logic
5. Inconsistent file organization

### Code Quality Issues
1. Inconsistent error handling
2. Mixed concerns in components
3. Redundant API calls
4. Loose type safety
5. Inconsistent naming conventions

## Proposed Architecture

### 1. Service Layer

```typescript
// src/lib/services/base.ts
export abstract class BaseService {
  protected async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`/api/${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      throw new AppError(
        'API_ERROR',
        'Request failed',
        { status: response.status }
      );
    }
    
    return response.json();
  }
}

// src/lib/services/gameService.ts
export class GameService extends BaseService {
  static async createOrUpdate(input: CreateGameInput): Promise<AdminGame> {
    return this.request('/games', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  }
  
  static async fetchByMonth(month: string): Promise<AdminGame[]> {
    return this.request(`/games?month=${month}`);
  }
  
  static async delete(date: string): Promise<void> {
    return this.request(`/games/${date}`, {
      method: 'DELETE'
    });
  }
}

// src/lib/services/spotifyService.ts
export class SpotifyService extends BaseService {
  static async searchTracks(query: string): Promise<SpotifyTrack[]> {
    return this.request(`/spotify/tracks?q=${encodeURIComponent(query)}`);
  }
  
  static async getPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
    return this.request(`/spotify/playlists/${playlistId}/tracks`);
  }
}
```

### 2. Unified State Management

```typescript
// src/stores/types.ts
export interface GameState {
  data: {
    games: Record<string, AdminGame>;
    tracks: Record<string, SpotifyTrack>;
  };
  
  ui: {
    editor: {
      mode: 'single' | 'batch';
      view: 'preview' | 'search';
      selectedDates: Date[];
      pendingChanges: Record<string, PendingChange>;
    };
    search: {
      query: string;
      results: string[]; // Track IDs
      status: RequestStatus;
    };
    playlist: {
      selectedId?: string;
      tracks: string[]; // Track IDs
    };
  };
  
  // Metadata
  status: {
    loading: Record<string, boolean>;
    errors: Record<string, AppError>;
  };
}

// src/stores/gameStore.ts
export const useGameStore = create<GameState & GameActions>((set, get) => ({
  // ... state implementation
}));

// src/stores/selectors.ts
export const selectors = {
  getGamesByMonth: (state: GameState, month: string) => {
    const startDate = startOfMonth(month);
    const endDate = endOfMonth(month);
    
    return Object.values(state.data.games).filter(game => 
      isWithinInterval(new Date(game.date), { start: startDate, end: endDate })
    );
  },
  
  getPendingChangesForDates: (state: GameState, dates: Date[]) => {
    return dates.reduce((acc, date) => {
      const key = format(date, 'yyyy-MM-dd');
      if (state.ui.editor.pendingChanges[key]) {
        acc[key] = state.ui.editor.pendingChanges[key];
      }
      return acc;
    }, {} as Record<string, PendingChange>);
  }
};
```

### 3. Component Structure

```typescript
// Component hierarchy with clear responsibilities
src/components/admin/game/
├── editor/
│   ├── EditorContainer.tsx     // Mode switching logic
│   ├── SingleEditor.tsx        // Single game editing
│   ├── BatchEditor.tsx         // Batch game editing
│   └── components/             // Shared editor components
├── calendar/
│   ├── CalendarContainer.tsx   // Calendar logic
│   ├── CalendarGrid.tsx        // Grid rendering
│   ├── CalendarDay.tsx         // Day cell rendering
│   └── hooks/                  // Calendar-specific hooks
├── track/
│   ├── TrackList.tsx          // Unified track list
│   ├── TrackSearch.tsx        // Search functionality
│   └── TrackPreview.tsx       // Track preview
└── shared/                     // Shared components
```

### 4. Error Handling

```typescript
// src/lib/errors.ts
export type ErrorCode = 
  | 'API_ERROR'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'SPOTIFY_ERROR';

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// src/hooks/useErrorHandler.ts
export function useErrorHandler() {
  const handleError = useCallback((error: unknown) => {
    if (error instanceof AppError) {
      switch (error.code) {
        case 'API_ERROR':
          toast.error('Operation failed. Please try again.');
          break;
        case 'NETWORK_ERROR':
          toast.error('Network error. Please check your connection.');
          break;
        // ... handle other cases
      }
    } else {
      toast.error('An unexpected error occurred.');
    }
  }, []);

  return { handleError };
}
```

### 5. Type Safety Improvements

```typescript
// src/types/game.ts
export interface AdminGame {
  id: string;
  date: string;
  song: SpotifyTrack;
  status: GameStatus;
  maskedLyrics: MaskedLyrics;
}

export type GameStatus = 
  | { type: 'draft' }
  | { type: 'scheduled' }
  | { type: 'active' }
  | { type: 'completed' };

export interface MaskedLyrics {
  title: string[];
  artist: string[];
  lyrics: string[];
}

// src/types/api.ts
export interface ApiResponse<T> {
  data: T;
  metadata?: {
    total?: number;
    page?: number;
  };
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}
```

## Implementation Strategy

1. **Phase 1: Service Layer**
   - Implement base service class
   - Create game and Spotify services
   - Migrate API calls to services

2. **Phase 2: State Management**
   - Set up Zustand store
   - Create selectors
   - Implement actions
   - Add type safety

3. **Phase 3: Component Refactor**
   - Reorganize component structure
   - Create shared components
   - Implement error boundaries
   - Add loading states

4. **Phase 4: Error Handling**
   - Implement error types
   - Add error handlers
   - Create error boundaries
   - Add toast notifications

5. **Phase 5: Testing**
   - Unit tests for services
   - Integration tests for store
   - Component tests
   - E2E workflow tests

## Benefits

1. **Improved Code Organization**
   - Clear separation of concerns
   - Consistent file structure
   - Reusable components
   - Type-safe operations

2. **Better State Management**
   - Single source of truth
   - Predictable updates
   - Efficient caching
   - Clear data flow

3. **Enhanced Error Handling**
   - Consistent error types
   - Centralized error handling
   - Better user feedback
   - Easy debugging

4. **Better Performance**
   - Reduced API calls
   - Optimized renders
   - Efficient caching
   - Better loading states

## Next Steps

1. Create detailed migration plan
2. Set up new folder structure
3. Implement service layer
4. Create store with types
5. Refactor components
6. Add tests
7. Performance optimization 