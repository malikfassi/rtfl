import type { Track } from '@spotify/web-api-ts-sdk';
import type { SpotifyId, PlaylistId } from '../spotify_ids';

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

// Helper function to create guesses
function createGuesses(lyrics: string, gameId: string, playerId: string = 'clrqm6nkw0010uy08kg9h1p4x') {
  const words = Array.from(new Set(
    lyrics.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length >= 4)
      .slice(0, 5) // Take first 5 unique words
  ));

  return words.map(word => ({
    gameId,
    playerId,
    word,
    createdAt: new Date()
  }));
}

export const seedHelpers = {
  createSongData,
  createGameData,
  createGuesses,
  SONG_IDS
}; 