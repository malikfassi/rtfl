import type { Track } from '@spotify/web-api-ts-sdk';
import { fixtures } from '../../fixtures';
import { isErrorCase } from '../../constants';

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
    
    // Additional Spotify API fields that may be present
    if (track.album) {
      expect(track.album).toHaveProperty('name');
    }
    
    // Compare with fixture (if not an error case)
    if (!isErrorCase(key)) {
      const fixture = fixtures.spotify.tracks[key];
      if (fixture && !('error' in fixture)) {
        // Check key properties match fixture
        expect(track.name.toLowerCase()).toContain(fixture.name.toLowerCase());
        expect(track.artists[0].name.toLowerCase()).toContain(fixture.artists[0].name.toLowerCase());
      }
    }
    
    return track;
  },

  searchTracks: (key: string, tracks: Track[]) => {
    expect(tracks).toBeDefined();
    expect(Array.isArray(tracks)).toBe(true);
    
    // For integration, we allow empty results
    tracks.forEach(track => {
      expect(track).toHaveProperty('id');
      expect(track).toHaveProperty('name');
      expect(track).toHaveProperty('artists');
      expect(Array.isArray(track.artists)).toBe(true);
    });
    
    // Compare with fixture
    const fixture = fixtures.spotify.search[key];
    if (fixture?.tracks?.items && fixture.tracks.items.length > 0) {
      // Check that at least one track matches expected
      const expectedFirst = fixture.tracks.items[0];
      const foundMatch = tracks.some(track => 
        track.name.toLowerCase().includes(expectedFirst.name.toLowerCase()) ||
        expectedFirst.name.toLowerCase().includes(track.name.toLowerCase())
      );
      expect(foundMatch).toBe(true);
    }
    
    return tracks;
  }
}; 