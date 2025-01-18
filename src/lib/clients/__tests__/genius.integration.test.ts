import { getGeniusClient } from '../genius';

describe('GeniusClient Integration Tests', () => {
  const geniusClient = getGeniusClient();

  it('should find lyrics for an existing song', async () => {
    const lyrics = await geniusClient.searchSong('party in the u.s.a. miley cyrus');
    expect(lyrics).toBeTruthy();
  });

  it('should return null for a non-existent song', async () => {
    // Use a more specific query that's unlikely to match any real songs
    const lyrics = await geniusClient.searchSong('xkcd7q completely fake song title by nonexistent artist 123456789');
    expect(lyrics).toBeNull();
  });
}); 