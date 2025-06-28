import { ErrorCode } from './codes';

type ErrorMessageFn = ((error: Error) => string) | ((playlistId: string) => string) | ((date: string) => string) | ((spotifyId: string) => string) | (() => string);

export const ErrorMessage: Record<ErrorCode, string | ErrorMessageFn> = {
  // Base
  [ErrorCode.ValidationError]: 'Validation error',
  [ErrorCode.NotFound]: 'Not found',
  [ErrorCode.InternalError]: 'Internal error',
  
  // Spotify
  [ErrorCode.SpotifyApiError]: (error: Error) => `Spotify API error: ${error.message}`,
  [ErrorCode.TrackNotFound]: 'Track not found',
  [ErrorCode.PlaylistNotFound]: (playlistId: string) => `Playlist not found: ${playlistId}`,
  [ErrorCode.NoMatchingTracks]: 'No matching tracks found',
  [ErrorCode.NoMatchingPlaylists]: 'No matching playlists found',
  [ErrorCode.NoTracksInPlaylist]: 'No tracks found in playlist',
  [ErrorCode.PlaylistTracksError]: (error: Error) => `Failed to fetch playlist tracks: ${error.message}`,

  // Genius
  [ErrorCode.GeniusApiError]: (error: Error) => `Genius API error: ${error.message}`,
  [ErrorCode.NoLyricsFound]: 'No lyrics found',
  [ErrorCode.NoMatchingLyrics]: 'No matching lyrics found',
  [ErrorCode.LyricsExtractionError]: (error: Error) => `Failed to extract lyrics: ${error.message}`,

  // Game
  [ErrorCode.GameNotFound]: (date: string) => `Game not found for date: ${date}`,

  // Guess
  [ErrorCode.DuplicateGuess]: 'Player has already submitted this word as a guess for this game',
  [ErrorCode.InvalidWord]: 'Word not found in lyrics',
  [ErrorCode.GameNotFoundForGuess]: (date: string) => `Game not found for date: ${date}`,

  // Song
  [ErrorCode.SongNotFound]: (spotifyId: string) => `Song not found with Spotify ID: ${spotifyId}`
} as const; 