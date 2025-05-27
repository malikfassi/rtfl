import { env } from '../env';
import { decode } from 'html-entities';

async function extractLyricsFromHTML(html: string): Promise<string | null> {
  // Try different selectors and patterns to find lyrics
  const patterns = [
    // Method 1: Modern lyrics container with data attribute (most reliable)
    {
      regex: /<div[^>]+?data-lyrics-container[^>]*?>([\s\S]*?)<\/div>/gi,
      extract: (matches: RegExpMatchArray | null) => {
        if (!matches) return null;
        return Array.from(matches)
          .map(match => match.replace(/<div[^>]+?data-lyrics-container[^>]*?>/i, '')
                            .replace(/<\/div>/i, '')
                            .trim())
          .join('\n\n');
      }
    },
    // Method 2: Legacy lyrics div
    {
      regex: /<div[^>]+?class="lyrics"[^>]*?>([\s\S]*?)<\/div>/i,
      extract: (match: RegExpMatchArray | null) => {
        if (!match || !match[1]) return null;
        return match[1];
      }
    }
  ];

  for (const pattern of patterns) {
    const matches = html.match(pattern.regex);
    if (matches) {
      const extracted = pattern.extract(matches);
      if (extracted) {
        // Clean up the lyrics text
        let lyrics = decode(extracted)
          .replace(/<br\s*\/?>/gi, '\n') // Convert <br> to newlines
          .replace(/<[^>]+>/g, '')  // Remove remaining HTML tags
          .replace(/\[.+?\]/g, '')   // Remove section headers
          .replace(/\{.+?\}/g, '')   // Remove annotations
          .replace(/\(\d+x\)/g, '')  // Remove repeat indicators
          .replace(/\s*\n\s*/g, '\n')  // Normalize whitespace around newlines
          .replace(/\n{3,}/g, '\n\n')  // Normalize multiple newlines
          .replace(/^\s+|\s+$/g, '')   // Trim start/end whitespace
          .trim();
          
        // Remove metadata lines
        lyrics = lyrics
          .split('\n')
          .filter(line => 
            !line.includes('Contributors') &&
            !line.includes('Translations') &&
            !line.includes('You might also like') &&
            line.trim().length > 0)
          .join('\n');

        if (lyrics.length > 0) {
          return lyrics;
        }
      }
    }
  }

  return null;
}

async function main() {
  try {
    const title = "Party in the U.S.A.";
    const artist = "Miley Cyrus";
    
    console.log(`Searching for "${title}" by ${artist}...`);
    
    // Search for the song using Genius API
    const searchResponse = await fetch(
      `https://api.genius.com/search?q=${encodeURIComponent(`${title} ${artist}`)}`,
      {
        headers: {
          'Authorization': `Bearer ${env.GENIUS_ACCESS_TOKEN}`,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
      }
    );
    
    if (!searchResponse.ok) {
      throw new Error(`Search request failed: ${searchResponse.statusText}`);
    }
    
    const searchData = await searchResponse.json();
    
    if (!searchData.response.hits || searchData.response.hits.length === 0) {
      throw new Error('No search results found');
    }
    
    // Get the first result
    const song = searchData.response.hits[0].result;
    console.log('\nFound song:');
    console.log('Title:', song.title);
    console.log('Artist:', song.primary_artist.name);
    console.log('URL:', song.url);
    
    // Fetch the lyrics page
    console.log('\nFetching lyrics...');
    const lyricsResponse = await fetch(song.url);
    if (!lyricsResponse.ok) {
      throw new Error(`Failed to fetch lyrics page: ${lyricsResponse.statusText}`);
    }
    
    const html = await lyricsResponse.text();
    const lyrics = await extractLyricsFromHTML(html);
    
    if (lyrics) {
      console.log('\nLyrics:');
      console.log('----------------------------------------');
      console.log(lyrics);
      console.log('----------------------------------------');
      console.log('\nStats:');
      console.log('Characters:', lyrics.length);
      console.log('Lines:', lyrics.split('\n').length);
    } else {
      console.log('\nNo lyrics found in the page');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
main(); 