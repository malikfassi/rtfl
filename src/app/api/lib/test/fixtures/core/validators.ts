import { expect } from '@jest/globals';
import type { Game, Song } from '@prisma/client';
import type { JsonValue } from '@prisma/client/runtime/library';
import type { Track } from '@spotify/web-api-ts-sdk';

import type { PlaylistTestCase,SongTestCase } from './test_cases';

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
      const expectedGenius = geniusData.response.hits[0].result;
      expect(actualGenius.url).toBe(expectedGenius.url);
      expect(actualGenius.title).toBe(expectedGenius.title);
      expect(actualGenius.artist).toBe(expectedGenius.primary_artist.name);

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
      const expectedGeniusData = testCase.genius.getSearch().response.hits[0].result;
      expect(geniusData.url).toBe(expectedGeniusData.url);
      expect(geniusData.title).toBe(expectedGeniusData.title);
      expect(geniusData.artist).toBe(expectedGeniusData.primary_artist.name);

      // Validate lyrics and masked lyrics
      expect(song.lyrics).toBe(testCase.lyrics.get());
      expect(song.maskedLyrics).toEqual(testCase.lyrics.getMasked());
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