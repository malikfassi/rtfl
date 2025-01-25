import { expect } from '@jest/globals';
import type { Game, Song } from '@prisma/client';
import type { JsonValue } from '@prisma/client/runtime/library';
import type { Track } from '@spotify/web-api-ts-sdk';

import type { GameState } from '@/app/api/lib/types/game';
import type { PlaylistTestCase,SongTestCase } from './test_cases';

// Helper function to validate masked text format
function validateMaskedText(text: string): void {
  // Validate that masked characters are underscores and visible characters are preserved
  expect(text).toMatch(/^[a-zA-Z0-9\s'",()._-]*$/);
  // Ensure consecutive underscores are used for masked words
  expect(text).not.toMatch(/^_$/);
  expect(text).not.toMatch(/[^_]_[^_]/);
}

export const validators = {
  unit: {
    song: (actual: Record<string, unknown>, testCase: SongTestCase) => {
      const track = testCase.spotify.getTrack();
      const geniusData = testCase.genius.getSearch();
      const maskedLyrics = testCase.lyrics.getMasked();

      // Check Spotify data
      expect(actual.spotifyId).toBe(testCase.id);
      expect(actual.spotifyData).toMatchObject({
        name: track.name,
        artists: track.artists.map(artist => ({
          id: artist.id,
          name: artist.name
        })),
        album: {
          name: track.album.name,
          images: track.album.images
        },
        preview_url: track.preview_url
      });

      // Check Genius data
      const actualGenius = actual.geniusData as { url: string; title: string; artist: string };
      expect(actualGenius).toEqual(testCase.genius.getBestMatch());

      // Check lyrics and masked lyrics
      expect(actual.lyrics).toBe(testCase.lyrics.get());
      expect(actual.maskedLyrics).toEqual(maskedLyrics);
    },
    playlist: (actual: Record<string, unknown>, testCase: PlaylistTestCase) => {
      expect(actual).toMatchObject({
        id: testCase.id,
        spotifyData: {
          id: testCase.spotify.getPlaylist().id,
          name: testCase.spotify.getPlaylist().name,
          owner: {
            id: testCase.spotify.getPlaylist().owner.id,
            display_name: testCase.spotify.getPlaylist().owner.display_name
          }
        }
      });
    },
    game: (actual: Record<string, unknown>, testCase: SongTestCase, date: string) => {
      // Validate game structure
      expect(actual).toBeDefined();
      expect(actual.date).toBe(date);
      expect(actual.songId).toBeDefined();

      // Validate associated song
      const song = (actual as { song: Song }).song;
      expect(song).toBeDefined();
      expect(song.spotifyId).toBe(testCase.id);
      
      const track = testCase.spotify.getTrack();
      expect(song.spotifyData as unknown as Track).toMatchObject({
        name: track.name,
        artists: track.artists.map(artist => ({
          id: artist.id,
          name: artist.name
        })),
        album: {
          name: track.album.name,
          images: track.album.images
        },
        preview_url: track.preview_url
      });
      
      // Validate Genius data
      const geniusData = song.geniusData as { url: string; title: string; artist: string };
      expect(geniusData).toEqual(testCase.genius.getBestMatch());

      // Validate lyrics and masked lyrics
      expect(song.lyrics).toBe(testCase.lyrics.get());
      expect(song.maskedLyrics).toEqual(testCase.lyrics.getMasked());
    },
    maskedLyrics: (actual: { title: string; artist: string; lyrics: string }) => {
      // Validate structure
      expect(actual).toBeDefined();
      expect(actual.title).toBeDefined();
      expect(actual.artist).toBeDefined();
      expect(actual.lyrics).toBeDefined();

      // Validate format of each field
      validateMaskedText(actual.title);
      validateMaskedText(actual.artist);
      
      // Validate lyrics - split by lines and check each line
      const lines = actual.lyrics.split('\n');
      lines.forEach(line => validateMaskedText(line));
    },
    guess: (actual: Record<string, unknown>) => {
      expect(actual).toMatchObject({
        id: expect.any(String),
        gameId: expect.any(String),
        playerId: expect.any(String),
        word: expect.any(String),
        createdAt: expect.any(Date)
      });
    },
    gameState: (actual: GameState, testCase: SongTestCase, playerId: string) => {
      // Validate structure
      expect(actual).toMatchObject({
        id: expect.any(String),
        date: expect.any(String),
        masked: expect.any(Object),
        guesses: expect.any(Array)
      });

      // Get guessed words for this specific player
      const guessedWords = new Set(
        actual.guesses
          .filter(guess => guess.playerId === playerId)
          .map(guess => guess.word)
      );

      // Validate masked state matches the player's guesses
      expect(actual.masked).toEqual(testCase.helpers.getMaskedState(guessedWords));

      // If there are guesses, validate their structure
      if (actual.guesses.length > 0) {
        actual.guesses.forEach(guess => {
          expect(guess).toMatchObject({
            id: expect.any(String),
            gameId: expect.any(String),
            playerId: expect.any(String),
            word: expect.any(String),
            createdAt: expect.any(Date)
          });
        });
      }

      // Validate song data presence based on win condition
      if (actual.song) {
        const track = testCase.spotify.getTrack();
        expect(actual.song).toMatchObject({
          name: track.name,
          artists: track.artists.map(artist => ({
            id: artist.id,
            name: artist.name
          })),
          album: {
            name: track.album.name,
            images: track.album.images
          },
          preview_url: track.preview_url
        });
      }
    }
  },
  integration: {
    song: (actual: Record<string, unknown>, testCase: SongTestCase) => {
      const track = testCase.spotify.getTrack();
      const maskedLyrics = testCase.lyrics.getMasked();
      expect(actual).toMatchObject({
        spotifyId: testCase.id,
        spotifyData: {
          name: track.name,
          artists: track.artists.map(artist => ({
            id: artist.id,
            name: artist.name
          })),
          album: {
            name: track.album.name,
            images: track.album.images
          },
          preview_url: track.preview_url
        },
        lyrics: testCase.lyrics.get(),
        maskedLyrics: {
          title: maskedLyrics.title,
          artist: maskedLyrics.artist,
          lyrics: maskedLyrics.lyrics
        }
      });
    },
    playlist: (actual: Record<string, unknown>, testCase: PlaylistTestCase) => {
      const playlist = testCase.spotify.getPlaylist();
      expect(actual).toMatchObject({
        id: testCase.id,
        spotifyData: {
          id: playlist.id,
          name: playlist.name,
          owner: {
            id: playlist.owner.id,
            display_name: playlist.owner.display_name
          }
        }
      });
    },
    game: (actual: Record<string, unknown>, testCase: SongTestCase, date: string) => {
      expect(actual).toBeDefined();
      expect(actual.date).toBe(date);
      
      // Validate essential game properties
      const game = actual as Game & { song: Song };
      expect(game.songId).toBeDefined();
      expect(game.song).toBeDefined();
      
      // Validate essential song properties
      expect(game.song.spotifyId).toBe(testCase.id);
      const track = testCase.spotify.getTrack();
      expect((game.song.spotifyData as JsonValue) as unknown as Track).toMatchObject({
        name: track.name,
        artists: track.artists.map(artist => ({
          id: artist.id,
          name: artist.name
        })),
        album: {
          name: track.album.name,
          images: track.album.images
        },
        preview_url: track.preview_url
      });
      expect(game.song.lyrics).toBe(testCase.lyrics.get());
      expect(game.song.maskedLyrics).toEqual(testCase.lyrics.getMasked());
    },
    spotifyTrack: (actual: Record<string, unknown>, expected: Track) => {
      expect(actual).toMatchObject({
        id: expected.id,
        name: expected.name,
        artists: expected.artists.map(artist => ({
          id: artist.id,
          name: artist.name
        })),
        album: {
          name: expected.album.name,
          images: expected.album.images
        },
        preview_url: expected.preview_url
      });
    }
  }
}; 
