import type { Track } from '@spotify/web-api-ts-sdk';
import { fixtures } from '../../fixtures';
import { TEST_IDS, isErrorCase } from '../../constants';

export const spotifyService = {
  getTrack: (key: string, track: Track) => {
    expect(track).toBeDefined();
    expect(track).toHaveProperty('id');
    expect(track).toHaveProperty('name');
    expect(track).toHaveProperty('artists');
    expect(Array.isArray(track.artists)).toBe(true);
    expect(track.artists.length).toBeGreaterThan(0);
    
    // Validate first artist
    expect(track.artists[0]).toHaveProperty('name');
    expect(typeof track.artists[0].name).toBe('string');
    expect(track.artists[0].name.length).toBeGreaterThan(0);
    
    // Compare with fixture (if not an error case)
    if (!isErrorCase(key)) {
      const fixture = fixtures.spotify.tracks[key];
      if (fixture && !('error' in fixture)) {
        // Check exact match for unit tests
        expect(track.id).toBe(fixture.id);
        expect(track.name).toBe(fixture.name);
        expect(track.artists[0].name).toBe(fixture.artists[0].name);
      }
    }
    
    return track;
  },

  searchTracks: (key: string, tracks: Track[]) => {
    expect(tracks).toBeDefined();
    expect(Array.isArray(tracks)).toBe(true);
    
    tracks.forEach(track => {
      expect(track).toHaveProperty('id');
      expect(track).toHaveProperty('name');
      expect(track).toHaveProperty('artists');
      expect(Array.isArray(track.artists)).toBe(true);
    });
    
    // Compare with fixture
    const fixture = fixtures.spotify.search[key];
    if (fixture?.tracks?.items && fixture.tracks.items.length > 0) {
      // For unit tests, expect exact match of first track
      const expectedFirst = fixture.tracks.items[0];
      expect(tracks.length).toBeGreaterThan(0);
      expect(tracks[0].id).toBe(expectedFirst.id);
      expect(tracks[0].name).toBe(expectedFirst.name);
    }
    
    return tracks;
  }
}; 