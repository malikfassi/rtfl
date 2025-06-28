import { GeniusData, GeniusHit } from '@/app/types';

/**
 * Constructs a clean search query for Genius by removing special characters,
 * version/remaster information, and normalizing whitespace.
 * Adds quotes around the title to improve exact matches.
 */
export function constructGeniusSearchQuery(title: string, artist: string): string {
  // Clean the title and artist by:
  // 1. Converting to lowercase
  // 2. Taking only the first part before any parentheses or dashes
  // 3. Removing remaster/version information
  // 4. Removing all apostrophes and quotes
  // 5. Keeping only letters (including French accented chars) and numbers
  // 6. Normalizing whitespace
  const cleanText = (text: string) => {
    const lowercase = text.toLowerCase();
    
    // Remove version/remaster info
    const withoutVersion = lowercase.replace(/\s*-.*$/, '').replace(/\s*\(.*\).*$/, '');
    
    // Remove all apostrophes and quotes
    const withoutQuotes = withoutVersion.replace(/[''′`"]/g, '');
    
    // Keep only letters (including French accented chars), numbers and spaces
    const withoutSpecialChars = withoutQuotes.replace(/[^a-zA-Z\d\sà-üÀ-Ü]/g, '');
    
    // Normalize whitespace
    const normalizedWhitespace = withoutSpecialChars.replace(/\s+/g, ' ').trim();
    
    return normalizedWhitespace;
  };

  const cleanTitle = cleanText(title);
  const cleanArtist = cleanText(artist);

  // Return the query with quotes around the title for exact matching
  return `"${cleanTitle}" ${cleanArtist}`;
}

/**
 * Extracts clean GeniusData from a GeniusHit.
 */
export function extractGeniusData(hit: GeniusHit): GeniusData {
  return {
    title: hit.result.title,
    url: hit.result.url ?? '',
    artist: hit.result.primary_artist?.name ?? ''
  };
}