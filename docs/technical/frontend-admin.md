# Frontend Admin Technical Documentation

## Data Fetching

### API Client
```typescript
interface AdminApiClient {
  // Game Management
  listGames(month: string): Promise<AdminGame[]>;
  getGame(date: string): Promise<AdminGame>;
  createOrUpdateGame(date: string, spotifyId: string): Promise<AdminGame>;
  deleteGame(date: string): Promise<void>;
  
  // Playlist Management
  listPlaylists(): Promise<Playlist[]>;
  getPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]>;
}

interface Playlist {
  id: string;
  name: string;
  description?: string;
  trackCount: number;
}

interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  previewUrl?: string;
}
```

## Core Components

### AdminDashboard
Main layout component for the admin interface
```typescript
function AdminDashboard() {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  
  return (
    <div className="admin-layout">
      <CalendarView
        month={currentMonth}
        selectedDates={selectedDates}
        onDateSelect={handleDateSelect}
        onMonthChange={setCurrentMonth}
        selectionMode={mode}
      />
      {mode === 'single' ? (
        <GameEditor 
          date={selectedDates[0]}
          key={selectedDates[0]}
        />
      ) : (
        <BulkGameCreator
          dates={selectedDates}
          onComplete={() => {
            setSelectedDates([]);
            setMode('single');
          }}
        />
      )}
    </div>
  );
}
```

### CalendarView
Monthly calendar with multi-select support
```typescript
interface CalendarViewProps {
  month: string;           // YYYY-MM
  selectedDates: string[];
  onDateSelect: (date: string) => void;
  onMonthChange: (month: string) => void;
  selectionMode: 'single' | 'bulk';
}

interface CalendarDay {
  date: string;
  hasGame: boolean;
  isSelected: boolean;
  stats?: {
    totalPlayers: number;
    successRate: number;
  };
}
```

### GameEditor
Single game creation and editing interface
```typescript
interface GameEditorProps {
  date: string | null;
}

function GameEditor({ date }: GameEditorProps) {
  const { game, isLoading } = useGame(date);
  const { createOrUpdateGame, deleteGame } = useGameMutations(date);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  
  if (!date) return <EmptyState message="Select a date to create or edit a game" />;
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div className="game-editor">
      <GameHeader 
        date={date}
        game={game}
        onDelete={deleteGame}
      />
      <PlaylistBrowser
        selectedId={selectedPlaylistId}
        onSelect={setSelectedPlaylistId}
      />
      {selectedPlaylistId && (
        <PlaylistSongBrowser
          playlistId={selectedPlaylistId}
          selectedSongId={game?.song?.spotifyId}
          onSongSelect={(spotifyId) => createOrUpdateGame(date, spotifyId)}
        />
      )}
      {game && (
        <GamePreview game={game} />
      )}
    </div>
  );
}
```

### BulkGameCreator
Create multiple games from a playlist
```typescript
interface BulkGameCreatorProps {
  dates: string[];
  onComplete: () => void;
}

function BulkGameCreator({ dates, onComplete }: BulkGameCreatorProps) {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const { createGames, isLoading } = useBulkGameCreation();
  
  return (
    <div className="bulk-game-creator">
      <header>
        <h2>Create {dates.length} Games</h2>
        <p>Select a playlist to randomly assign songs to selected dates</p>
      </header>
      
      <PlaylistBrowser
        selectedId={selectedPlaylistId}
        onSelect={setSelectedPlaylistId}
      />
      
      {selectedPlaylistId && (
        <Button
          onClick={async () => {
            await createGames(dates, selectedPlaylistId);
            onComplete();
          }}
          isLoading={isLoading}
        >
          Create Games
        </Button>
      )}
    </div>
  );
}
```

### PlaylistBrowser
Browse and select Spotify playlists
```typescript
interface PlaylistBrowserProps {
  selectedId?: string | null;
  onSelect: (playlistId: string) => void;
}

function PlaylistBrowser({ selectedId, onSelect }: PlaylistBrowserProps) {
  const { playlists, isLoading } = usePlaylists();
  
  return (
    <div className="playlist-browser">
      <h3>Select Playlist</h3>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <ul className="playlist-list">
          {playlists.map(playlist => (
            <PlaylistItem
              key={playlist.id}
              playlist={playlist}
              isSelected={playlist.id === selectedId}
              onSelect={() => onSelect(playlist.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
```

### PlaylistSongBrowser
Browse and select songs from a playlist
```typescript
interface PlaylistSongBrowserProps {
  playlistId: string;
  selectedSongId?: string;
  onSongSelect: (spotifyId: string) => void;
}

function PlaylistSongBrowser({ playlistId, selectedSongId, onSongSelect }: PlaylistSongBrowserProps) {
  const { tracks, isLoading } = usePlaylistTracks(playlistId);
  
  return (
    <div className="song-browser">
      <h3>Select Song</h3>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <ul className="track-list">
          {tracks.map(track => (
            <TrackItem
              key={track.id}
              track={track}
              isSelected={track.id === selectedSongId}
              onSelect={() => onSongSelect(track.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Additional Hooks

### usePlaylists
```typescript
function usePlaylists() {
  return useQuery({
    queryKey: ['playlists'],
    queryFn: () => adminApi.listPlaylists(),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}
```

### usePlaylistTracks
```typescript
function usePlaylistTracks(playlistId: string) {
  return useQuery({
    queryKey: ['playlist', 'tracks', playlistId],
    queryFn: () => adminApi.getPlaylistTracks(playlistId),
    enabled: !!playlistId
  });
}
```

### useBulkGameCreation
```typescript
function useBulkGameCreation() {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: async (params: { dates: string[], playlistId: string }) => {
      const { dates, playlistId } = params;
      const tracks = await adminApi.getPlaylistTracks(playlistId);
      
      // Create games in sequence with random tracks
      return Promise.all(dates.map(async (date) => {
        const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
        return adminApi.createOrUpdateGame(date, randomTrack.id);
      }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'games']);
    }
  });
  
  return {
    createGames: (dates: string[], playlistId: string) => 
      mutation.mutateAsync({ dates, playlistId }),
    isLoading: mutation.isLoading
  };
}
```

## Hooks

### useGame
Fetch and cache game data
```typescript
function useGame(date: string | null) {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['admin', 'game', date],
    queryFn: () => adminApi.getGame(date!),
    enabled: !!date
  });
}
```

### useGameMutations
Manage game mutations with optimistic updates
```typescript
function useGameMutations(date: string | null) {
  const queryClient = useQueryClient();
  
  const createOrUpdateMutation = useMutation({
    mutationFn: (spotifyId: string) => 
      adminApi.createOrUpdateGame(date!, spotifyId),
    onSuccess: (game) => {
      queryClient.setQueryData(['admin', 'game', date], game);
      queryClient.invalidateQueries(['admin', 'games']);
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteGame(date!),
    onSuccess: () => {
      queryClient.removeQueries(['admin', 'game', date]);
      queryClient.invalidateQueries(['admin', 'games']);
    }
  });
  
  return {
    createOrUpdateGame: createOrUpdateMutation.mutate,
    deleteGame: deleteMutation.mutate,
    isLoading: createOrUpdateMutation.isLoading || deleteMutation.isLoading
  };
}
```

### useSpotifySearch
Handle Spotify track search with debouncing
```typescript
function useSpotifySearch(query: string) {
  return useQuery({
    queryKey: ['spotify', 'search', query],
    queryFn: () => adminApi.searchSpotifyTracks(query),
    enabled: query.length >= 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: []
  });
}
```

## State Management

Using React Query for server state management:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

// Query keys
const queryKeys = {
  games: (month: string) => ['admin', 'games', month],
  game: (date: string) => ['admin', 'game', date],
  spotifySearch: (query: string) => ['spotify', 'search', query]
} as const;
```

## Error Handling

```typescript
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundaryComponent
          onReset={reset}
          fallback={({ error, resetErrorBoundary }) => (
            <ErrorDisplay
              error={error as AdminError}
              onRetry={resetErrorBoundary}
            />
          )}
        >
          {children}
        </ErrorBoundaryComponent>
      )}
    </QueryErrorResetBoundary>
  );
}
```

## Loading States

### Skeleton Components
```typescript
// Common skeleton for lists and grids
function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="skeleton-item"
          style={{ 
            height: '2rem',
            background: '#7E69AB20',
            marginBottom: '0.5rem',
            borderRadius: '4px'
          }} 
        />
      ))}
    </div>
  );
}

// Calendar day skeleton
function CalendarDaySkeleton() {
  return (
    <div 
      className="calendar-day-skeleton"
      style={{ 
        height: '5rem',
        background: '#7E69AB10',
        borderRadius: '4px'
      }}
    />
  );
}
```

### Loading States Per Component
```typescript
// PlaylistBrowser loading
function PlaylistBrowser({ selectedId, onSelect }: PlaylistBrowserProps) {
  const { playlists, isLoading } = usePlaylists();
  
  if (isLoading) {
    return (
      <div className="playlist-browser">
        <h3>Select Playlist</h3>
        <SkeletonList count={5} />
      </div>
    );
  }
  // ... rest of component
}

// PlaylistSongBrowser loading
function PlaylistSongBrowser({ playlistId, selectedSongId, onSongSelect }: PlaylistSongBrowserProps) {
  const { tracks, isLoading } = usePlaylistTracks(playlistId);
  
  if (isLoading) {
    return (
      <div className="song-browser">
        <h3>Select Song</h3>
        <SkeletonList count={10} />
      </div>
    );
  }
  // ... rest of component
}

// Calendar loading
function CalendarView({ month, selectedDates, onDateSelect }: CalendarViewProps) {
  const { games, isLoading } = useGames(month);
  
  if (isLoading) {
    return (
      <div className="calendar-grid">
        {Array.from({ length: 35 }).map((_, i) => (
          <CalendarDaySkeleton key={i} />
        ))}
      </div>
    );
  }
  // ... rest of component
}
```

## Game Preview Components

### PlayerPreview
Preview how the game will appear to players
```typescript
interface PlayerPreviewProps {
  game: AdminGame;
}

function PlayerPreview({ game }: PlayerPreviewProps) {
  return (
    <div className="player-preview" style={{ fontFamily: 'monospace' }}>
      <header style={{ color: '#9b87f5' }}>
        Player View Preview
      </header>
      
      <section className="masked-title" style={{ color: '#7E69AB' }}>
        <h3>Title</h3>
        <div className="masked-words">
          {game.song.maskedLyrics?.title.map((word, i) => (
            <span 
              key={i}
              className="masked-word"
              style={{ 
                marginRight: '0.5rem',
                letterSpacing: '0.1em'
              }}
            >
              {word}
            </span>
          ))}
        </div>
      </section>
      
      <section className="masked-artist" style={{ color: '#6E59A5' }}>
        <h3>Artist</h3>
        <div className="masked-words">
          {game.song.maskedLyrics?.artist.map((word, i) => (
            <span 
              key={i}
              className="masked-word"
              style={{ 
                marginRight: '0.5rem',
                letterSpacing: '0.1em'
              }}
            >
              {word}
            </span>
          ))}
        </div>
      </section>
      
      <section className="masked-lyrics" style={{ color: '#D6BCFA' }}>
        <h3>Lyrics</h3>
        <div className="masked-words">
          {game.song.maskedLyrics?.lyrics.map((word, i) => (
            <span 
              key={i}
              className="masked-word"
              style={{ 
                marginRight: '0.5rem',
                letterSpacing: '0.1em',
                display: 'inline-block',
                marginBottom: '0.25rem'
              }}
            >
              {word}
            </span>
          ))}
        </div>
      </section>
      
      {game.song.previewUrl && (
        <section className="preview-player" style={{ marginTop: '1rem' }}>
          <div 
            className="preview-locked"
            style={{ 
              color: '#FF719A',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <LockIcon />
            Preview available after winning
          </div>
        </section>
      )}
    </div>
  );
}
```

### GameEditor with Preview
```typescript
function GameEditor({ date }: GameEditorProps) {
  const { game, isLoading } = useGame(date);
  const { createOrUpdateGame, deleteGame } = useGameMutations(date);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  
  if (!date) return <EmptyState message="Select a date to create or edit a game" />;
  if (isLoading) return <SkeletonList count={3} />;
  
  return (
    <div className="game-editor">
      <div className="editor-section">
        <GameHeader 
          date={date}
          game={game}
          onDelete={deleteGame}
        />
        <PlaylistBrowser
          selectedId={selectedPlaylistId}
          onSelect={setSelectedPlaylistId}
        />
        {selectedPlaylistId && (
          <PlaylistSongBrowser
            playlistId={selectedPlaylistId}
            selectedSongId={game?.song?.spotifyId}
            onSongSelect={(spotifyId) => createOrUpdateGame(date, spotifyId)}
          />
        )}
      </div>
      
      {game && (
        <div className="preview-section">
          <PlayerPreview game={game} />
        </div>
      )}
    </div>
  );
}
```

## Global Styles

```typescript
const theme = {
  colors: {
    primary: '#9b87f5',
    secondary: '#7E69AB',
    tertiary: '#6E59A5',
    light: '#D6BCFA',
    accent1: '#FF719A',
    accent2: '#FFA99F',
    accent3: '#FFE29F',
    accent4: '#abecd6',
  },
  fonts: {
    mono: 'Menlo, Monaco, "Courier New", monospace',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
} as const;

const globalStyles = css`
  body {
    font-family: ${theme.fonts.mono};
    background: white;
    color: ${theme.colors.secondary};
  }

  button {
    font-family: ${theme.fonts.mono};
    background: transparent;
    border: none;
    color: ${theme.colors.primary};
    cursor: pointer;
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    transition: color 0.2s;

    &:hover {
      color: ${theme.colors.accent1};
    }

    &:disabled {
      color: ${theme.colors.secondary}40;
      cursor: not-allowed;
    }
  }

  input {
    font-family: ${theme.fonts.mono};
    background: transparent;
    border: 1px solid ${theme.colors.light}40;
    padding: ${theme.spacing.sm};
    color: ${theme.colors.secondary};
    
    &:focus {
      outline: none;
      border-color: ${theme.colors.primary};
    }
  }

  // Minimalist scrollbar
  ::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: ${theme.colors.light};
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }
`;
```
``` 