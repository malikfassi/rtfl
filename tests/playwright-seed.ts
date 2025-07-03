import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { TEST_IDS, TRACK_KEYS, TRACK_URIS } from '../src/app/api/lib/test/constants';
import { fixtures } from '../src/app/api/lib/test/fixtures';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.test file
config({ path: '.env.test' });

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

// Word extraction regex (same as MaskedLyricsService)
const WORD_REGEX = /\p{L}+|\p{N}+/gu;

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test dates
const TODAY = new Date().toISOString().split('T')[0];
const YESTERDAY = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const TWO_DAYS_AGO = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const THREE_DAYS_AGO = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const FUTURE_DATE = '2025-12-25';
const INVALID_DATE = '2024-13-45';

// Test players
const PLAYER_1 = 'testplayer01';
const PLAYER_2 = 'testplayer02';
const PLAYER_3 = 'testplayer03';

type TrackKey = keyof typeof TRACK_KEYS;

/**
 * Load processed lyrics from .txt fixture files
 */
function loadProcessedLyrics(key: TrackKey): string | null {
  try {
    // Use relative path from tests directory
    const lyricsPath = path.join(process.cwd(), 'src/app/api/lib/test/fixtures/data/genius/lyrics', `${key}.txt`);
    if (fs.existsSync(lyricsPath)) {
      return fs.readFileSync(lyricsPath, 'utf-8');
    }
  } catch (error) {
    console.warn(`Failed to load processed lyrics for ${key}:`, error);
  }
  return null;
}

/**
 * Extract valid words from lyrics using the same regex as the codebase
 */
function extractWordsFromLyrics(lyrics: string): string[] {
  const matches = Array.from(lyrics.matchAll(WORD_REGEX));
  return matches.map(match => match[0].toLowerCase());
}

/**
 * Get some valid words from a track's processed lyrics for testing
 */
function getValidWordsForTrack(key: TrackKey, count: number = 5): string[] {
  const processedLyrics = loadProcessedLyrics(key);
  if (!processedLyrics) {
    console.warn(`No processed lyrics found for ${key}, using fallback words`);
    return ['test', 'word', 'example', 'sample', 'data'];
  }
  
  const words = extractWordsFromLyrics(processedLyrics);
  // Filter out very short words and duplicates
  const validWords = [...new Set(words.filter(word => word.length >= 3))];
  
  // Return requested number of words, or all if not enough
  return validWords.slice(0, count);
}

async function createGame(date: string, key: TrackKey) {
  const spotifyId = TRACK_URIS[TRACK_KEYS[key]];
  if (!spotifyId) throw new Error(`No spotifyId for key: ${key}`);
  // The admin API will create the song if it doesn't exist, using the spotifyId
  const res = await fetch(`${BASE_URL}/api/admin/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, spotifyId }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ Game creation failed for ${date}:`, { status: res.status, text });
    throw new Error(`Failed to create game for ${date}: ${res.status} ${text}`);
  }
  console.log(`✅ Game created for ${date} with ${key}`);
  return res.json();
}

async function createGuess(date: string, playerId: string, guess: string, valid: boolean = false) {
  // The guess API expects a POST to /api/games/[date]/guess with { guess }
  const res = await fetch(`${BASE_URL}/api/games/${date}/guess`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': playerId,
    },
    body: JSON.stringify({ guess }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ Guess creation failed for ${date}:`, { 
      status: res.status, 
      text, 
      playerId, 
      guess,
      headers: Object.fromEntries(res.headers.entries())
    });
    throw new Error(`Failed to create guess for ${date}: ${res.status} ${text}`);
  }
  console.log(`✅ Guess created for ${date}: ${playerId} -> "${guess}"`);
  return res.json();
}

async function seedDatabase() {
  console.log('🌱 Seeding Playwright test database using admin API and fixtures...');
  console.log(`📊 Using database: ${process.env.DATABASE_URL}`);
  console.log(`🌐 Using base URL: ${BASE_URL}`);

  // Today: new game, no guesses
  await createGame(TODAY, 'BABY_ONE_MORE_TIME');

  // Yesterday: game with 3 guesses (1 correct, 2 incorrect)
  await createGame(YESTERDAY, 'BILLIE_JEAN');
  // Add small delay to ensure game is fully created
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Get valid words from BILLIE_JEAN lyrics - need 3 different words
  const billieJeanWords = getValidWordsForTrack('BILLIE_JEAN', 6);
  console.log(`📝 Using words from BILLIE_JEAN: ${billieJeanWords.join(', ')}`);
  
  console.log(`🎯 Creating guess 1: ${PLAYER_1} -> "${billieJeanWords[0]}"`);
  await createGuess(YESTERDAY, PLAYER_1, billieJeanWords[0], true);
  await new Promise(resolve => setTimeout(resolve, 500)); // Add delay between guesses
  
  console.log(`🎯 Creating guess 2: ${PLAYER_2} -> "${billieJeanWords[1]}"`);
  await createGuess(YESTERDAY, PLAYER_2, billieJeanWords[1], false);
  await new Promise(resolve => setTimeout(resolve, 500)); // Add delay between guesses
  
  console.log(`🎯 Creating guess 3: ${PLAYER_3} -> "${billieJeanWords[2]}"`);
  await createGuess(YESTERDAY, PLAYER_3, billieJeanWords[2], false);

  // Two days ago: game with 3 guesses (2 correct, 1 incorrect)
  await createGame(TWO_DAYS_AGO, 'BEAT_IT');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Get valid words from BEAT_IT lyrics - need 3 different words
  const beatItWords = getValidWordsForTrack('BEAT_IT', 6);
  console.log(`📝 Using words from BEAT_IT: ${beatItWords.join(', ')}`);
  
  console.log(`🎯 Creating guess 4: ${PLAYER_1} -> "${beatItWords[0]}"`);
  await createGuess(TWO_DAYS_AGO, PLAYER_1, beatItWords[0], true);
  await new Promise(resolve => setTimeout(resolve, 500)); // Add delay between guesses
  
  console.log(`🎯 Creating guess 5: ${PLAYER_2} -> "${beatItWords[1]}"`);
  await createGuess(TWO_DAYS_AGO, PLAYER_2, beatItWords[1], true);
  await new Promise(resolve => setTimeout(resolve, 500)); // Add delay between guesses
  
  console.log(`🎯 Creating guess 6: ${PLAYER_3} -> "${beatItWords[2]}"`);
  await createGuess(TWO_DAYS_AGO, PLAYER_3, beatItWords[2], false);

  // Three days ago: game with no guesses
  await createGame(THREE_DAYS_AGO, 'THRILLER');

  // Future game
  await createGame(FUTURE_DATE, 'LIKE_A_PRAYER');

  console.log('✅ Database seeded successfully using admin API!');
}

export { 
  seedDatabase, 
  TODAY, 
  YESTERDAY, 
  TWO_DAYS_AGO, 
  THREE_DAYS_AGO, 
  FUTURE_DATE, 
  INVALID_DATE,
  PLAYER_1,
  PLAYER_2,
  PLAYER_3
};

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
} 