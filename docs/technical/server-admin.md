# Server Admin Technical Documentation

## Core Services

### SongService
- Manages song creation and retrieval
- Handles metadata fetching and processing
- Methods:
  ```typescript
  interface SongService {
    findBySpotifyId(spotifyId: string): Promise<Song | null>;
    createFromSpotifyId(spotifyId: string): Promise<Song>;
    getOrCreate(spotifyId: string): Promise<Song>;
  }
  ```

### AdminGameService
- Manages game administration
- Handles game CRUD operations
- Methods:
  ```typescript
  interface AdminGameService {
    listGames(month: string): Promise<AdminGame[]>;
    getGame(date: string): Promise<AdminGame>;
    createGame(date: string, spotifyId: string): Promise<AdminGame>;
    updateGame(date: string, spotifyId: string): Promise<AdminGame>;
    deleteGame(date: string): Promise<void>;
  }
  ```

## Models

### Core Models
```typescript
// Song model - stored in songs table
interface Song {
  id: string;
  spotifyId: string;
  title: string;
  artist: string;
  previewUrl?: string;
  lyrics?: string;
  maskedLyrics?: {
    title: string[];    // Masked versions of title words
    artist: string[];   // Masked versions of artist words
    lyrics: string[];   // Masked versions of lyrics words
  };
}

// Game model - stored in games table
interface Game {
  id: string;
  date: string;        // Unique
  songId: string;      // References Song.id
}

// Game statistics - stored in game_stats table
interface GameStats {
  totalPlayers: number;
  successCount: number;
  totalGuesses: number;
}

// Admin view of game
interface AdminGame extends Game {
  song: Song;
  stats?: GameStats;
}
```

## Service Logic

### Song Management
```typescript
class SongService {
  constructor(
    private spotifyClient: SpotifyClient,
    private geniusClient: GeniusClient,
    private lyricsService: LyricsService,
    private db: Database
  ) {}

  async findBySpotifyId(spotifyId: string): Promise<Song | null> {
    return await this.db.songs.findBySpotifyId(spotifyId);
  }

  async createFromSpotifyId(spotifyId: string): Promise<Song> {
    // 1. Fetch Spotify data
    const spotifyData = await this.spotifyClient.getTrack(spotifyId);
    if (!spotifyData) {
      throw new AdminError('SPOTIFY_ERROR', 'Failed to fetch Spotify track data');
    }

    // 2. Fetch Genius lyrics
    const lyrics = await this.geniusClient.fetchLyrics(spotifyData);
    if (!lyrics) {
      throw new AdminError('GENIUS_ERROR', 'Failed to fetch lyrics');
    }

    // 3. Generate masked lyrics
    const maskedLyrics = await this.lyricsService.generateMaskedLyrics({
      title: spotifyData.title,
      artist: spotifyData.artist,
      lyrics
    });

    // 4. Create and return song
    return await this.db.songs.create({
      spotifyId,
      title: spotifyData.title,
      artist: spotifyData.artist,
      previewUrl: spotifyData.previewUrl,
      lyrics,
      maskedLyrics
    });
  }

  async getOrCreate(spotifyId: string): Promise<Song> {
    const existing = await this.findBySpotifyId(spotifyId);
    if (existing) return existing;
    return await this.createFromSpotifyId(spotifyId);
  }
}
```

### Game Management
```typescript
class AdminGameService {
  constructor(
    private songService: SongService,
    private db: Database
  ) {}

  async createGame(date: string, spotifyId: string): Promise<AdminGame> {
    // 1. Get or create song
    const song = await this.songService.getOrCreate(spotifyId);

    // 2. Create game entry
    const game = await this.db.games.create({
      date,
      songId: song.id
    });

    // 3. Return complete game
    return {
      ...game,
      song
    };
  }

  async updateGame(date: string, spotifyId: string): Promise<AdminGame> {
    // 1. Verify game exists
    const existingGame = await this.db.games.getGameByDate(date);
    if (!existingGame) {
      throw new AdminError('NOT_FOUND', 'Game not found');
    }

    // 2. Get or create song
    const song = await this.songService.getOrCreate(spotifyId);

    // 3. Update game with new song
    const updatedGame = await this.db.games.update(existingGame.id, {
      songId: song.id
    });

    // 4. Return updated game
    return {
      ...updatedGame,
      song
    };
  }
}
```

## Error Handling

### Error Types
```typescript
enum AdminError {
  INVALID_DATE = 'INVALID_DATE',
  NOT_FOUND = 'NOT_FOUND',
  SPOTIFY_ERROR = 'SPOTIFY_ERROR',
  GENIUS_ERROR = 'GENIUS_ERROR'
}
```

### Error Responses
```typescript
interface AdminErrorResponse {
  error: AdminError;
  message: string;
  details?: {
    field?: string;
    reason?: string;
  };
}
``` 