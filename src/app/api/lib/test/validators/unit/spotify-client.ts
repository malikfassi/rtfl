import type { Track, SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';
import { fixtures } from '../../fixtures';
import { TEST_IDS } from '../../constants';
import { constructSpotifySearchQuery } from '../../../utils/spotify';

type SpotifyTrackFixture = Track;

export const spotify_client = {
  track: (track: unknown, id: string) => {
    expect(track).toBeDefined();
    const t = track as Track;
    const fixture = fixtures.spotify.getTrack.get(id) as SpotifyTrackFixture;
    
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

  search: (tracks: unknown, query: string) => {
    expect(Array.isArray(tracks)).toBe(true);
    const results = tracks as Track[];
    
    // Get the reference track from fixtures
    const referenceTrack = fixtures.spotify.getTrack.get(TEST_IDS.SPOTIFY.TRACKS.PARTY_IN_THE_USA);
    const expectedQuery = constructSpotifySearchQuery(referenceTrack.name, referenceTrack.artists[0].name);
    
    // Only validate against fixture if the query matches our reference track
    if (query === expectedQuery) {
      const fixtureResults = fixtures.spotify.searchTracks.get(query);
      expect(results).toEqual(fixtureResults);
    }
    
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

  playlist_search: (response: unknown, query: string) => {
    expect(response).toBeDefined();
    const result = response as { playlists: { items: SimplifiedPlaylist[] } };
    
    // Get the reference playlist from fixtures
    const fixtureResults = fixtures.spotify.searchPlaylists.get(query);
    
    // Compare with fixture data
    console.log('Query:', query);
    console.log('First playlist item:', result.playlists.items[0]);
    expect(result).toEqual(fixtureResults);
    
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

  playlist_tracks: (tracks: unknown, id: string) => {
    expect(Array.isArray(tracks)).toBe(true);
    const results = tracks as Track[];
    const fixture = fixtures.spotify.getPlaylistTracks.get(id);
    
    // Validate each track has required structure
    results.forEach(track => {
      expect(track.id).toBeDefined();
      expect(track.name).toBeDefined();
      expect(Array.isArray(track.artists)).toBe(true);
      expect(track.artists.length).toBeGreaterThan(0);
      expect(track.artists[0].name).toBeDefined();
    });

    // Compare with fixture
    expect(results).toEqual(fixture);
    return true;
  }
};