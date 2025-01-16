# Game & Admin Product Requirements

## Overview
- Product Purpose
  - Daily music guessing game
  - Word guessing mechanics
  - Stats tracking

- Target Audience
  - Music enthusiasts
  - Word game players
  - Daily puzzle solvers

- Key Features
  - Daily song challenges
  - Word reveal mechanics
  - Progress tracking
  - Stats sharing

## Game Features
### Core Mechanics
- Daily Challenge
  - One song available each day
  - All words hidden with underscores
  - Same song for all players globally
  - Individual progress tracking per player

- Guessing System
  - Word-by-word exact match guessing
  - Words can be from:
    - Song title
    - Artist name
    - Lyrics
  - Automatic word reveal on exact match
  - No hints or difficulty progression

- Winning Conditions
  - Find all title and artist words OR
  - Reveal 80% of lyrics words
  - Post-win features:
    - Reveal full song
    - Toggle visibility of unfound words

- Scoring
  - Progress percentage
  - Artist words found
  - Title words found
  - Daily streak

### User Experience
- Game Flow
  - Clear onboarding
  - Daily song refresh
  - Progress indicators
  - Immediate feedback

- Music Integration
  - Song preview (only after winning)
  - Lyrics display (hidden/revealed words)
  - Artist information (hidden/revealed)

- Social Features
  - Share results
  - Daily rankings
  - Global statistics
  - Personal statistics

- User Identification
  - Client-generated UUID
  - Stored in localStorage
  - Anonymous tracking

### Stats System
- Player Statistics (Store Procedure)
  - Games played
  - Success rate
  - Total guesses
  - Best streaks

- Global Stats (Store Procedure)
  - By day and all-time:
    - Total unique players
    - Total guesses
    - Success rates
  - Leaderboard

### Admin Interface
- Layout
  - Left: Calendar View
  - Right: GameEditor
  - Initial state: Auto-focuses on current day and loads its game in editor

- Calendar View
  - Month-based pagination of games
  - Game status indicators:
    - Highlight days with games
    - Orange warning for missing cache data
  - Auto-focus on current day
  - Click day to update GameEditor view

- GameEditor
  - Empty State (No Game for Selected Day)
    - Shows null placeholder
    - Focuses on playlist browser
    - Ready for game creation
  
  - Playlist Browser
    - Display: "playlistName (spotifyId, songCount)"
    - Click to edit: shows playlist search input
    - Select new playlist from results
    - Returns to display format
    - Selecting new playlist resets overrideSongId to null

  - Song Browser
    - Display: "songName (spotifyId)"
    - Click for dropdown of playlist songs
    - Dropdown focused on currently selected song
    - Shows hint about seed-selected song
    - Song selection:
      - Click seed-selected song: sets overrideSongId to null
      - Click different song: sets overrideSongId to that song
    - Returns to display format showing current selection

  - Seed Management
    - Display current random seed
    - Button to regenerate seed

  - Game Creation Flow
    - Select empty date
    - Choose playlist
    - System handles:
      - Game ID generation
      - Random seed
      - Song selection (from seed or override)
      - Cache prefetch

## Technical Requirements
### Game Data
- Core Data
  - Unique game ID
  - Unique date
  - Playlist Spotify ID
  - Random seed

- Store Procedures
  - Selected song computation
  - Masked lyrics generation
  - Stats calculations
  - Cache management

### Integrations
- Spotify Integration
  - OAuth 2.0 authentication
  - Playlist/track metadata access
  - Simple metadata cache

- Genius Integration
  - API key authentication
  - Lyrics retrieval
  - Simple lyrics cache 