// Type definitions for lyrics data
export interface LyricsFixture {
  lyrics: string;
  maskedLyrics: {
    title: string[];
    artist: string[];
    lyrics: string[];
  };
}

export interface LyricsJson {
  [key: string]: LyricsFixture;
}

// Import the JSON data
import lyricsJsonData from './json/lyrics.json';
export const lyricsJson = lyricsJsonData as LyricsJson;

// Helper functions
export function getLyrics(songKey: string): string {
  return lyricsJson[songKey].lyrics;
}

export function getMaskedLyrics(songKey: string): string[] {
  return lyricsJson[songKey].maskedLyrics.lyrics;
}

export function getMaskedTitle(songKey: string): string[] {
  return lyricsJson[songKey].maskedLyrics.title;
}

export function getMaskedArtist(songKey: string): string[] {
  return lyricsJson[songKey].maskedLyrics.artist;
}

// Re-export the JSON data for direct access
export default lyricsJson; 