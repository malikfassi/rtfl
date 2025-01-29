export enum ErrorCode {
  // Base
  ValidationError = 'VALIDATION_ERROR',
  NotFound = 'NOT_FOUND',
  InternalError = 'INTERNAL_ERROR',

  // Spotify
  SpotifyApiError = 'SPOTIFY_API_ERROR',
  TrackNotFound = 'TRACK_NOT_FOUND',
  PlaylistNotFound = 'PLAYLIST_NOT_FOUND',
  NoMatchingTracks = 'NO_MATCHING_TRACKS',
  NoMatchingPlaylists = 'NO_MATCHING_PLAYLISTS',
  NoTracksInPlaylist = 'NO_TRACKS_IN_PLAYLIST',
  PlaylistTracksError = 'PLAYLIST_TRACKS_ERROR',

  // Genius
  GeniusApiError = 'GENIUS_API_ERROR',
  NoLyricsFound = 'NO_LYRICS_FOUND',
  NoMatchingLyrics = 'NO_MATCHING_LYRICS',
  LyricsExtractionError = 'LYRICS_EXTRACTION_ERROR',

  // Game
  GameNotFound = 'GAME_NOT_FOUND',

  // Guess
  DuplicateGuess = 'DUPLICATE_GUESS',
  InvalidWord = 'INVALID_WORD',
  GameNotFoundForGuess = 'GAME_NOT_FOUND_FOR_GUESS',

  // Song
  SongNotFound = 'SONG_NOT_FOUND'
} 