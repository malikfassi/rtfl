import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { SpotifyAuthError } from '../errors';

let spotifyApi: SpotifyApi | null = null;

export async function getSpotifyApi(): Promise<SpotifyApi> {
  if (spotifyApi) {
    return spotifyApi;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new SpotifyAuthError('Missing Spotify credentials');
  }

  try {
    spotifyApi = SpotifyApi.withClientCredentials(clientId, clientSecret);
    await spotifyApi.authenticate();
    return spotifyApi;
  } catch {
    throw new SpotifyAuthError('Failed to authenticate with Spotify');
  }
}

// For testing purposes
export function resetSpotifyApi(): void {
  spotifyApi = null;
}
