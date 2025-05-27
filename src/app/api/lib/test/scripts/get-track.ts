import { getSpotifyClient } from '@/app/api/lib/clients/spotify';
import { getGeniusClient } from '@/app/api/lib/clients/genius';
import { lyricsService } from '@/app/api/lib/services/lyrics';

async function main() {
  const spotifyClient = getSpotifyClient();
  const geniusClient = getGeniusClient();

  // Get track from Spotify
  const trackId = '3E7dfMvvCLUddWissuqMwr';
  const track = await spotifyClient.getTrack(trackId);
  
  console.log('Spotify Track Info:');
  console.log({
    name: track.name,
    artist: track.artists[0].name,
    album: track.album.name
  });

  // Search Genius
  const searchQuery = `${track.name} ${track.artists[0].name}`;
  const searchResults = await geniusClient.search(searchQuery);
  
  // Get the first result's URL
  const lyricsUrl = searchResults.response.hits[0].result.url;
  if (!lyricsUrl) {
    throw new Error('No lyrics URL found');
  }
  
  console.log('\nGenius Lyrics URL:', lyricsUrl);

  // Fetch lyrics
  const lyrics = await lyricsService.getLyrics(lyricsUrl);
  console.log('\nLyrics:');
  console.log(lyrics);
}

main().catch(console.error); 