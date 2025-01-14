# Song Guessing Game - Requirements Document

## Core Game Mechanics

### Daily Game
- One hidden song per day
- Lyrics are masked (underscores), preserving formatting and special characters
- Users guess words to reveal matching parts
- Win condition: 80% lyrics found
- Artist name and song title are also hidden and part of the game
- Special UI effects for finding artist/title and winning
- Exact word matches only (no partial matches)
- Case-insensitive matching
- Punctuation and special characters revealed by default
- No automatic reveal of common words
- Progress bar shows completion towards 80% goal
- Matched words are highlighted in masked lyrics
- Guess history displayed during gameplay
- Rate limit: 1 guess per second
- No maximum attempts limit

### User Features
- Anonymous users (UUID in localStorage)
- Can play current and archived games
- See their stats and global stats
- Progress saved per game
- Progressive reveal of lyrics based on correct guesses
- No hints or song metadata shown before winning
- Already guessed words not stored
- Uses Spotify API for artist name and title
- Uses Genius API for main lyrics version
- Share capability planned for future implementation
- Game state always fetched from server (no local persistence)
- Browser refresh fetches fresh state

### Technical Architecture
- Next.js + React + TypeScript
- Minimal API routes (getDaily, guess, etc.)
- Data caching for external services
- No async gameplay
- API tests required
- Strict linting and type checking
- Project generator to be used
- JetBrains Mono as primary font
- Dark mode support
- SQLite database
- Prisma as ORM
- Rate limiting implemented on both frontend and backend (1/second)
- No visual feedback for rate limiting
- No client-side state persistence (except UUID)
- External API interactions restricted to admin panel
- Error handling and surfacing for admin operations

### Admin Features
- Calendar view of game configs
- Spotify playlist integration
- Manual song override capability
- Batch creation of game configs
- Cache management for Spotify/Genius data
- Can generate random seeds from backend
- Can search and select playlists via Spotify
- Analytics dashboard (metrics TBD)
- Warning system for editing played games
- Error handling for Spotify/Genius API issues

### Data Storage
- Game configs (seed, playlist ID, override song ID)
- User guesses
- Minimal external data (Spotify/Genius IDs)
- Cached Data:
  - Spotify song metadata and artist/title
  - Playlist names
  - Genius lyrics (main version only)

### API Routes
- Get daily game
- Submit guess
- List previous games (with user results)
- Admin routes for configuration

### External Services
- Spotify API for music metadata
- Genius API for lyrics
- Data from both services should be cached 

### Design Guidelines
- Minimalist interface
- Typography:
  - Monospace font family throughout the application
  - No borders or dividing lines
- Color Palette:
  - Primary Purple: #9b87f5
  - Deep Purple: #7E69AB
  - Royal Purple: #6E59A5
  - Light Purple: #D6BCFA
  - Pink: #FF719A
  - Coral: #FFA99F
  - Soft Yellow: #FFE29F
  - Mint: #abecd6
- Usage Guidelines:
  - Dark purples (#7E69AB, #6E59A5) for text and important elements
  - Light purple (#D6BCFA) and mint (#abecd6) for backgrounds and highlights
  - Pink (#FF719A) and coral (#FFA99F) for interactive elements and success states
  - Soft yellow (#FFE29F) for warnings or special callouts
  - Primary purple (#9b87f5) for primary actions and branding 