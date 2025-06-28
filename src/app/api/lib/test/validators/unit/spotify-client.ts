import type { Track, SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';
import { fixtures } from '../../fixtures';

type SpotifyTrackFixture = Track;

// All fixture access is by constant key only. No mapping helpers used.
export const spotify_client = {
  track: (track: unknown, key: string) => {
    expect(track).toBeDefined();
    const t = track as Track;
    const fixture = fixtures.spotify.tracks[key] as SpotifyTrackFixture;
    
    // Validate track structure
    expect(t.id).toBeDefined();
    expect(t.name).toBeDefined();
    expect(Array.isArray(t.artists)).toBe(true);
    expect(t.artists.length).toBeGreaterThan(0);
    expect(t.artists[0].name).toBeDefined();
    
    // Compare with fixture
    expect(t).toEqual(fixture);
    return true;
  },

  search: (tracks: unknown, key: string) => {
    expect(Array.isArray(tracks)).toBe(true);
    const results = tracks as Track[];
    
    // Only validate against fixture if the key matches our reference track
    const fixtureResults = fixtures.spotify.search[key]?.tracks?.items || [];
    expect(results).toEqual(fixtureResults);
    
    // Validate each track has required structure
    results.forEach(track => {
      expect(track.id).toBeDefined();
      expect(track.name).toBeDefined();
      expect(Array.isArray(track.artists)).toBe(true);
      expect(track.artists.length).toBeGreaterThan(0);
      expect(track.artists[0].name).toBeDefined();
    });

    return true;
  },

  playlist_search: (response: unknown, key: string) => {
    expect(response).toBeDefined();
    const result = response as { playlists: { items: SimplifiedPlaylist[] } };
    const fixtureResults = fixtures.spotify.search[key]?.playlists || { items: [] };
    expect(result.playlists.items).toEqual(fixtureResults.items);
    
    // Validate playlist structure
    expect(Array.isArray(result.playlists.items)).toBe(true);
    // Filter out null values before validation
    const validPlaylists = result.playlists.items.filter(playlist => playlist !== null);
    validPlaylists.forEach(playlist => {
      expect(playlist.id).toBeDefined();
      expect(playlist.name).toBeDefined();
      expect(playlist.type).toBe('playlist');
    });

    return true;
  },

  playlist_tracks: (tracks: unknown, key: string) => {
    expect(Array.isArray(tracks)).toBe(true);
    const results = tracks as Track[];
    const fixture = fixtures.spotify.playlists[key]?.tracks.items.map(item => item.track) || [];
    expect(results).toEqual(fixture);

    // Validate each track has required structure
    results.forEach(track => {
      expect(track.id).toBeDefined();
      expect(track.name).toBeDefined();
      expect(Array.isArray(track.artists)).toBe(true);
      expect(track.artists.length).toBeGreaterThan(0);
      expect(track.artists[0].name).toBeDefined();
    });

    return true;
  }
};