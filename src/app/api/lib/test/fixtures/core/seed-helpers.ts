import type { Track } from '@spotify/web-api-ts-sdk';
import type { SpotifyId, PlaylistId } from '../spotify_ids';
import { TEST_IDS } from './test_cases';

import geniusJson from '../data/genius.json';
import lyricsJson from '../data/lyrics.json';
import spotifyJson from '../data/spotify.json';
import { SONG_IDS } from '../spotify_ids';

// Helper types
interface SpotifyFixtures {
  tracks: Partial<Record<SpotifyId, Track>>;
  errors?: {
    tracks: Partial<Record<SpotifyId, { status: number; message: string }>>;
    playlists: Partial<Record<PlaylistId, { status: number; message: string }>>;
  };
}

type GeniusFixtures = {
  byId: Partial<Record<SpotifyId, {
    url: string;
    title: string;
    artist: string;
  }>>;
};

type LyricsFixtures = Partial<Record<SpotifyId, string>>;

// Type assertions with runtime validation
const typedSpotifyJson = spotifyJson as unknown as SpotifyFixtures;
const typedGeniusJson = geniusJson as GeniusFixtures;
const typedLyricsJson = lyricsJson as LyricsFixtures;

// Helper function for masking text
function maskText(text: string): string {
  return text.replace(/\p{L}+|\p{N}+/gu, word => '_'.repeat(word.length));
}

// Helper function to create song data
function createSongData(id: SpotifyId) {
  const track = typedSpotifyJson.tracks[id];
  const geniusData = typedGeniusJson.byId[id];
  const lyrics = typedLyricsJson[id];

  if (!track || !geniusData || !lyrics) {
    throw new Error(`Missing data for song ${id}`);
  }

  return {
    spotifyId: id,
    spotifyData: JSON.parse(JSON.stringify({
      name: track.name,
      artists: track.artists.map((artist) => ({ name: artist.name, id: artist.id })),
      album: {
        name: track.album.name,
        images: track.album.images
      },
      preview_url: track.preview_url
    })),
    geniusData: JSON.parse(JSON.stringify({
      url: geniusData.url,
      title: geniusData.title,
      artist: geniusData.artist
    })),
    lyrics,
    maskedLyrics: JSON.parse(JSON.stringify({
      title: maskText(track.name),
      artist: maskText(track.artists[0].name),
      lyrics: maskText(lyrics)
    }))
  };
}

// Helper function to create game data
function createGameData(date: string, songId: string) {
  return {
    where: { date },
    create: {
      date,
      songId
    },
    update: {
      songId
    }
  };
}

// Helper function to get words that can be guessed
function getWordsToGuess(text: string): string[] {
  const words = new Set<string>();
  
  // Use regex to match all letter/number sequences
  const matches = text.toLowerCase().matchAll(/\p{L}+|\p{N}+/gu);
  for (const match of matches) {
    const word = match[0];
    if (/^[a-z]+$/.test(word)) {
      words.add(word);
    }
  }
  
  return Array.from(words);
}

// Helper function to create guesses
function createGuesses(lyrics: string, gameId: string, playerId: string = TEST_IDS.PLAYER_2) {
  const words = getWordsToGuess(lyrics).slice(0, 5); // Take first 5 words
  const baseDate = new Date('2025-01-25T12:00:00Z');

  return words.map((word, index) => ({
    gameId,
    playerId,
    word,
    createdAt: new Date(baseDate.getTime() + index * 60000) // Add one minute per guess
  }));
}

export const seedHelpers = {
  createSongData,
  createGameData,
  createGuesses,
  SONG_IDS
}; 