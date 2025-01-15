# Admin Dashboard Implementation Plan

## Overview
The admin dashboard consists of two main sections:
1. Calendar view (left)
2. Game manager (right)

## Current Status
- ✅ Basic calendar view implemented
- ✅ Basic game editor structure
- ✅ Playlist browser
- ✅ Song browser
- ✅ Basic game CRUD operations
- ✅ Third-party metadata enrichment (Spotify, Genius)

## Required Features & Implementation Steps

### 1. Game Manager Layout
- [x] Split view into two columns
- [x] Add game metadata section
- [x] Add song preview section
- [x] Improve overall styling and spacing

### 2. Game ID Display
- [x] Show game ID (null if not created)
- [x] Add proper formatting and styling
- [x] Handle null state

### 3. Random Seed Management
- [x] Display random seed (null if not created)
- [x] Add regenerate seed button
- [x] Implement seed regeneration functionality
- [x] Refresh game view with new seed

### 4. Playlist Management
- [x] Display playlist browser
- [x] Show playlist ID and name
- [x] Handle playlist selection
- [x] Create/edit game with new playlist ID
- [x] Refresh game frontend state

### 5. Song Selection
- [x] Display song browser with selected song
- [x] Implement song selection
- [x] Update game with override song ID
- [x] Add "Use Random Seed" button
- [x] Refresh frontend state on changes

### 6. Metadata Display
- [x] Show Spotify metadata (song name, artist name, playlist name)
- [x] Display Genius lyrics
- [x] Handle loading states
- [x] Handle error states

### 7. Song Player
- [x] Display song player when game is created
- [x] Handle preview URL availability
- [x] Add proper audio controls
- [x] Handle loading and error states

### 8. Bug Fixes & Improvements
- [ ] Fix linter error: unused selectedPlaylistId
- [ ] Fix linter error: refreshGameData type
- [ ] Add proper error handling for all API calls
- [ ] Add loading states for all async operations
- [ ] Improve error messages and user feedback

## Testing Plan
1. Game Creation Flow
   - Create new game by selecting playlist
   - Verify game ID and random seed are generated
   - Verify metadata is displayed correctly

2. Song Selection Flow
   - Select song from browser
   - Override with random seed
   - Verify frontend state updates

3. Random Seed Flow
   - Regenerate random seed
   - Verify game view updates
   - Verify song selection persists/updates correctly

4. Error Handling
   - Test API failure scenarios
   - Verify error messages are displayed
   - Verify UI remains usable

## Notes
- All third-party metadata (Spotify, Genius) is already enriched in existing endpoints
- Frontend state should be refreshed after any game modification
- UI should be responsive and handle loading states gracefully
- Error messages should be user-friendly and actionable 