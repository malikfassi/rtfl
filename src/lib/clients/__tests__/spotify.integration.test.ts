import { getSpotifyClient } from '../spotify';
import { PARTY_IN_THE_U_S_A_ } from '../../fixtures/songs';

describe('SpotifyClient Integration Tests', () => {
  const spotifyClient = getSpotifyClient(
    process.env.SPOTIFY_CLIENT_ID,
    process.env.SPOTIFY_CLIENT_SECRET
  );

  describe('searchTracks', () => {
    it('should find tracks for a popular song', async () => {
      const query = `${PARTY_IN_THE_U_S_A_.maskedLyrics.title.join(' ')} ${PARTY_IN_THE_U_S_A_.maskedLyrics.artist.join(' ')}`;
      const tracks = await spotifyClient.searchTracks(query);
      
      expect(tracks).toBeTruthy();
      expect(tracks.length).toBeGreaterThan(0);
      expect(tracks[0].id).toBe(PARTY_IN_THE_U_S_A_.spotifyId);
    });

    it('should return empty array for non-existent song', async () => {
      const tracks = await spotifyClient.searchTracks('xkcd7q completely fake song title by nonexistent artist 123456789');
      expect(tracks).toEqual([]);
    });
  });

  describe('getTrack', () => {
    it('should get track details by ID', async () => {
      const track = await spotifyClient.getTrack(PARTY_IN_THE_U_S_A_.spotifyId);
      expect(track).toBeTruthy();
      if (track) {
        expect(track.name.toLowerCase()).toBe(PARTY_IN_THE_U_S_A_.maskedLyrics.title.join(' '));
      }
    });

    it('should return null for non-existent track ID', async () => {
      const track = await spotifyClient.getTrack('1234567890123456789012');
      expect(track).toBeNull();
    });
  });
}); 