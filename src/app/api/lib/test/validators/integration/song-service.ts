import type { Song } from '@prisma/client';
import { fixtures } from '../../fixtures';
import { TRACK_KEYS, TRACK_URIS } from '../../constants';

export const songService = {
  create: (key: string, song: Song) => {
    expect(song).toBeDefined();
    expect(song).toHaveProperty('id');
    expect(song).toHaveProperty('spotifyId');
    expect(song).toHaveProperty('spotifyData');
    expect(song).toHaveProperty('geniusData');
    expect(song).toHaveProperty('lyrics');
    expect(song).toHaveProperty('maskedLyrics');
    expect(song).toHaveProperty('createdAt');
    expect(song).toHaveProperty('updatedAt');
    
    // Validate data types
    expect(typeof song.id).toBe('string');
    expect(typeof song.spotifyId).toBe('string');
    expect(typeof song.lyrics).toBe('string');
    expect(song.lyrics.length).toBeGreaterThan(0);
    
    // Validate Spotify ID format (integration tests use real IDs)
    expect(song.spotifyId).toMatch(/^[A-Za-z0-9]+$/);
    expect(song.spotifyId).toHaveLength(22);
    
    // Validate JSON fields are not null
    expect(song.spotifyData).not.toBeNull();
    expect(song.geniusData).not.toBeNull();
    expect(song.maskedLyrics).not.toBeNull();
    
    // Compare with fixtures
    const spotifyFixture = fixtures.spotify.tracks[key];
    const geniusFixture = fixtures.genius.search[key];
    
    if (spotifyFixture && !('error' in spotifyFixture)) {
      // Check spotify data matches fixture
      const spotifyData = song.spotifyData as any;
      expect(spotifyData.name.toLowerCase()).toContain(spotifyFixture.name.toLowerCase());
      expect(spotifyData.artists[0].name.toLowerCase()).toContain(spotifyFixture.artists[0].name.toLowerCase());
    }
    
    if (geniusFixture && geniusFixture.response.hits.length > 0) {
      // Check genius data matches fixture
      const geniusData = song.geniusData as any;
      const expectedHit = geniusFixture.response.hits[0].result;
      expect(geniusData.title.toLowerCase()).toContain(expectedHit.title.toLowerCase());
      expect(geniusData.artist.toLowerCase()).toContain(expectedHit.primary_artist?.name.toLowerCase() || '');
    }
    
    // Check the spotifyId matches the expected URI for the key
    const expectedUri = TRACK_URIS[key as keyof typeof TRACK_KEYS];
    if (expectedUri) {
      const expectedId = expectedUri.split(':').pop();
      expect(song.spotifyId).toBe(expectedId);
    }
    
    return song;
  }
}; 