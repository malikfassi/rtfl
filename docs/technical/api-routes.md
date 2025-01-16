# API Routes Documentation

## Admin Routes

### Game Management

#### GET /api/admin/games
List games or get a specific game.

**Query Parameters:**
- `month`: string (YYYY-MM format) - Filter games by month
- `date`: string (YYYY-MM-DD format) - Filter games by specific date

**Response:**
```typescript
interface Response {
  games: {
    id: string;
    date: string;
    song: {
      id: string;
      spotifyId: string;
      title: string;
      artist: string;
      previewUrl?: string;
      lyrics: string;
      maskedLyrics: {
        title: string[];
        artist: string[];
        lyrics: string[];
      };
    };
    stats?: {
      totalPlayers: number;
      successRate: number;
    };
  }[];
}
```

**Errors:**
- `400`: Invalid month or date format
- `401`: Unauthorized (not an admin)

#### POST /api/admin/games
Create or update a game.

**Query Parameters:**
- `date`: string (YYYY-MM-DD format) - Required

**Request Body:**
```typescript
interface Request {
  spotifyId: string;
}
```

**Response:** Same as GET /api/admin/games?date=YYYY-MM-DD

**Errors:**
- `400`: Invalid date format or Spotify ID
- `401`: Unauthorized (not an admin)
- `404`: Spotify track not found
- `500`: Error fetching lyrics or other external service error

#### DELETE /api/admin/games
Delete a game.

**Query Parameters:**
- `date`: string (YYYY-MM-DD format) - Required

**Response:**
```typescript
interface Response {
  success: true;
}
```

**Errors:**
- `400`: Invalid date format
- `401`: Unauthorized (not an admin)
- `404`: Game not found

### Spotify Proxy

#### GET /api/admin/spotify/playlists
Search user's Spotify playlists.

**Query Parameters:**
- `q`: string - Search query
- `limit`: number (optional, defaults to 20)
- `offset`: number (optional, defaults to 0)

**Response:**
```typescript
interface Response {
  playlists: {
    id: string;
    name: string;
    description?: string;
    trackCount: number;
  }[];
  pagination: {
    total: number;
    offset: number;
    limit: number;
  };
}
```

**Errors:**
- `401`: Unauthorized (not an admin)
- `500`: Error fetching from Spotify API

#### GET /api/admin/spotify/playlists/[id]/tracks
Get tracks from a Spotify playlist.

**Parameters:**
- `id`: string (Spotify playlist ID) in URL path

**Query Parameters:**
- `limit`: number (optional, defaults to 20)
- `offset`: number (optional, defaults to 0)

**Response:**
```typescript
interface Response {
  tracks: {
    id: string;
    title: string;
    artist: string;
    album: string;
    previewUrl?: string;
  }[];
  pagination: {
    total: number;
    offset: number;
    limit: number;
  };
}
```

**Errors:**
- `401`: Unauthorized (not an admin)
- `404`: Playlist not found
- `500`: Error fetching from Spotify API

### Error Responses

All error responses follow this format:
```typescript
interface ErrorResponse {
  error: string;  // Error code
  message: string;  // Human-readable error message
  details?: any;    // Additional error details if available
}
```

Common error codes:
- `INVALID_DATE`: Date format is invalid
- `INVALID_MONTH`: Month format is invalid
- `UNAUTHORIZED`: User is not authenticated or not an admin
- `NOT_FOUND`: Requested resource not found
- `SPOTIFY_ERROR`: Error fetching data from Spotify
- `GENIUS_ERROR`: Error fetching lyrics from Genius
- `DATABASE_ERROR`: Database operation failed
``` 