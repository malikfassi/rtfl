# Game Editor Implementation Plan

## 1. Data Layer Setup
1. Create API Hooks
   ```typescript
   - useGame(date: string)
   - useGameMutations(date: string)
   - usePlaylists()
   - usePlaylistTracks(playlistId: string)
   ```
2. Create Type Definitions
   ```typescript
   - AdminGame
   - Playlist
   - SpotifyTrack
   - GameMutations
   ```

## 2. Component Structure
1. Core Components
   ```typescript
   /src/components/admin/game/
   - GameEditor.tsx (main container)
   - GameHeader.tsx (date + delete button)
   - PlaylistBrowser.tsx (list of playlists)
   - PlaylistSongBrowser.tsx (list of songs)
   - GamePreview.tsx (preview game state)
   ```

2. UI Components
   ```typescript
   /src/components/ui/
   - LoadingSpinner.tsx
   - EmptyState.tsx
   - Button.tsx
   - List.tsx
   ```

## 3. Implementation Order

### Phase 1: Data Layer
1. Set up React Query client configuration
2. Implement API hooks
   - `useGame` for fetching single game
   - `useGameMutations` for CRUD operations
   - `usePlaylists` for fetching playlists
   - `usePlaylistTracks` for fetching songs

### Phase 2: UI Components
1. Create base UI components with monospace design
   - LoadingSpinner
   - EmptyState
   - Button
   - List

### Phase 3: Game Editor Components
1. GameHeader
   ```typescript
   - Display date in MM.dd.yyyy format
   - Delete button with confirmation
   - Monospace styling
   ```

2. PlaylistBrowser
   ```typescript
   - List of playlists with selection
   - Loading state
   - Error handling
   - Minimalist design
   ```

3. PlaylistSongBrowser
   ```typescript
   - List of songs from selected playlist
   - Preview button for each song
   - Loading state
   - Error handling
   ```

4. GamePreview
   ```typescript
   - Show masked lyrics preview
   - Show song info
   - Preview player (locked state)
   ```

### Phase 4: Main GameEditor
1. Container component setup
2. State management
3. Component integration
4. Error boundaries
5. Loading states

## 4. Styling Guidelines
1. Use monospace font (JetBrains Mono)
2. Color palette:
   ```css
   - Primary: #9b87f5
   - Deep Purple: #7E69AB
   - Royal Purple: #6E59A5
   - Light Purple: #D6BCFA
   - Pink: #FF719A
   - Coral: #FFA99F
   - Yellow: #FFE29F
   - Mint: #abecd6
   ```
3. Minimalist design:
   - No borders
   - Minimal padding
   - Code-like indicators
   - Simple hover states

## 5. Testing Strategy
1. Unit tests for hooks
2. Component tests for UI elements
3. Integration tests for GameEditor
4. Mock API responses

## Progress Tracking

### Phase 1: Data Layer [2/2]
- [x] API Hooks
- [x] Type Definitions

### Phase 2: UI Components [4/4]
- [x] LoadingSpinner
- [x] EmptyState
- [x] Button
- [x] List

### Phase 3: Game Editor Components [4/4]
- [x] GameHeader
- [x] PlaylistBrowser
- [x] PlaylistSongBrowser
- [x] GamePreview

### Phase 4: Main GameEditor [5/5]
- [x] Container setup
- [x] State management
- [x] Component integration
- [x] Error boundaries
- [x] Loading states

### Phase 5: Testing [0/4]
- [ ] Hook tests
- [ ] UI component tests
- [ ] Integration tests
- [ ] API mocks

## Total Progress: 15/19 tasks completed (79%) 