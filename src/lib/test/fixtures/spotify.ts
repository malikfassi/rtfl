import type { Track, SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';
import spotifyJson from './json/spotify.json';

type SpotifyData = {
  tracks: Record<string, Track>;
  searches: Record<string, { tracks: { items: Track[] }; playlists?: { items: SimplifiedPlaylist[] } }>;
  playlists: Record<string, SimplifiedPlaylist>;
  playlistTracks: Record<string, Track[]>;
};

export const spotifyData = spotifyJson as unknown as SpotifyData; 