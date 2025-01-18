import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { writeFile } from 'fs/promises';
import { join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: `${dirname(__dirname)}/.env` });

// Verify environment variables before any imports
const requiredEnvVars = {
  GENIUS_ACCESS_TOKEN: process.env.GENIUS_ACCESS_TOKEN,
  SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([name]) => name);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

// Now we can safely import and use the clients
import { getGeniusClient } from '../src/lib/clients/genius';
import { getSpotifyClient } from '../src/lib/clients/spotify';

interface SongFixture {
  spotifyId: string;
  lyrics: string;
  maskedLyrics: {
    title: string[];
    artist: string[];
    lyrics: string[];
  };
}

class FixtureGenerator {
  private geniusClient;
  private spotifyClient;
  private fixtures: Record<string, SongFixture> = {};

  constructor() {
    // Initialize clients with explicit credentials
    this.geniusClient = getGeniusClient(process.env.GENIUS_ACCESS_TOKEN);
    this.spotifyClient = getSpotifyClient(
      process.env.SPOTIFY_CLIENT_ID,
      process.env.SPOTIFY_CLIENT_SECRET
    );
  }

  async findSpotifyTrack(title: string, artist: string): Promise<string | null> {
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const query = `${title} ${artist}`;
        console.log(`Searching Spotify for: ${query} (attempt ${attempt}/${maxRetries})`);
        
        const tracks = await this.spotifyClient.searchTracks(query);
        if (tracks && tracks.length > 0) {
          const track = tracks[0];
          console.log('Found:', track.name, 'by', track.artists[0].name, '(ID:', track.id, ')');
          return track.id;
        }
        
        console.log('❌ No tracks found on Spotify');
        return null;
      } catch (error) {
        const isNetworkError = error instanceof TypeError && 
          (error.message.includes('fetch failed') || 
           ('cause' in error && (error.cause as { code?: string })?.code === 'ENOTFOUND'));

        if (isNetworkError && attempt < maxRetries) {
          console.log(`Network error on attempt ${attempt}/${maxRetries}, retrying in ${retryDelay/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }

        console.error('Failed to search tracks:', error);
        return null;
      }
    }
    
    console.error('Failed to connect to Spotify after', maxRetries, 'attempts');
    return null;
  }

  async generateFixture(title: string, artist: string) {
    console.log('\n=== Generating fixture for:', title, 'by', artist, '===\n');
    
    try {
      // First find the track on Spotify
      const spotifyId = await this.findSpotifyTrack(title, artist);
      if (!spotifyId) {
        return;
      }

      // Get full track info
      const track = await this.spotifyClient.getTrack(spotifyId);
      if (!track) {
        console.log('❌ Failed to get track details');
        return;
      }
      
      console.log('✅ Spotify Track:', track.name, 'by', track.artists[0].name);
      
      // Get lyrics from Genius
      const searchQuery = `${track.name} ${track.artists[0].name}`;
      console.log('\nSearching Genius for:', searchQuery);
      const lyrics = await this.geniusClient.searchSong(searchQuery);
      
      if (lyrics) {
        console.log('✅ Genius Lyrics found!');
        
        // Generate fixture object
        const fixture = {
          spotifyId,
          lyrics,
          maskedLyrics: {
            title: track.name.toLowerCase().split(/\s+/),
            artist: track.artists[0].name.toLowerCase().split(/\s+/),
            lyrics: lyrics.toLowerCase().split(/\s+/).slice(0, 5) // Just take first 5 words for testing
          }
        };

        // Store the fixture
        const constName = title.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
        this.fixtures[constName] = fixture;

        // Print the fixture
        console.log('\nGenerated Fixture:');
        console.log('----------------------------------------');
        console.log(`export const ${constName} = ${JSON.stringify(fixture, null, 2)};`);
        console.log('----------------------------------------\n');
      } else {
        console.log('❌ Genius: No lyrics found');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async writeFixtures() {
    const fixturesPath = join(__dirname, '..', 'src', 'lib', 'fixtures', 'songs.ts');
    const fixtureEntries = Object.entries(this.fixtures);
    
    if (fixtureEntries.length === 0) {
      console.log('No fixtures to write');
      return;
    }

    // Generate the file content
    const fileContent = [
      '// This file is auto-generated by scripts/test-lyrics.ts',
      '// Do not edit this file directly',
      '',
      ...fixtureEntries.map(([name, fixture]) => 
        `export const ${name} = ${JSON.stringify(fixture, null, 2)};`
      ),
      '',
      `export const songs = {`,
      ...fixtureEntries.map(([name]) => `  ${name},`),
      `};`,
      ''
    ].join('\n');

    // Write the file
    await writeFile(fixturesPath, fileContent, 'utf-8');
    console.log(`\n✅ Wrote ${fixtureEntries.length} fixtures to ${fixturesPath}`);
  }

  async run() {
    const songs = [
      { title: 'Party in the U.S.A.', artist: 'Miley Cyrus' },
      { title: '...Baby One More Time', artist: 'Britney Spears' },
      { title: 'A Bar Song', artist: 'Shaboozey' }
    ];
    
    for (const song of songs) {
      await this.generateFixture(song.title, song.artist);
    }

    await this.writeFixtures();
  }
}

// Run the generator
const generator = new FixtureGenerator();
generator.run().catch(console.error);
