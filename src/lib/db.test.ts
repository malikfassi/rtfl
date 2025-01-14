import { prisma } from './db';
import {
  createGameConfig,
  getGameConfigByDate,
  createGuess,
  getUserGuesses,
  cacheSpotifyTrack,
  getCachedSpotifyTrack,
  cacheLyrics,
  getCachedLyricsBySpotifyId,
} from './db';

// Clear database before each test
beforeEach(async () => {
  await prisma.guess.deleteMany();
  await prisma.gameConfig.deleteMany();
  await prisma.cachedSpotifyTrack.deleteMany();
  await prisma.cachedSpotifyPlaylist.deleteMany();
  await prisma.cachedGeniusLyrics.deleteMany();
});

describe('Game Config Operations', () => {
  it('should create and retrieve a game config', async () => {
    const date = new Date();
    const config = await createGameConfig({
      date,
      randomSeed: 'test-seed',
      playlistId: 'test-playlist',
      overrideSongId: null,
    });

    expect(config.date).toEqual(date);
    expect(config.randomSeed).toBe('test-seed');
    expect(config.playlistId).toBe('test-playlist');

    const retrieved = await getGameConfigByDate(date);
    expect(retrieved?.id).toBe(config.id);
  });
});

describe('Guess Operations', () => {
  it('should create and retrieve guesses', async () => {
    const config = await createGameConfig({
      date: new Date(),
      randomSeed: 'test-seed',
      playlistId: 'test-playlist',
      overrideSongId: null,
    });

    const userId = 'test-user';
    await createGuess({
      userId,
      gameConfigId: config.id,
      word: 'test-word',
    });

    const guesses = await getUserGuesses(userId, config.id);
    expect(guesses).toHaveLength(1);
    expect(guesses[0].word).toBe('test-word');
  });
});

describe('Cache Operations', () => {
  it('should cache and retrieve Spotify track data', async () => {
    const spotifyId = 'test-track-id';
    const trackData = JSON.stringify({ name: 'Test Track' });

    await cacheSpotifyTrack(spotifyId, trackData);
    const cached = await getCachedSpotifyTrack(spotifyId);

    expect(cached?.data).toBe(trackData);
  });

  it('should cache and retrieve lyrics', async () => {
    const geniusId = 'test-genius-id';
    const spotifyId = 'test-spotify-id';
    const lyrics = 'Test lyrics';

    await cacheLyrics(geniusId, spotifyId, lyrics);
    const cached = await getCachedLyricsBySpotifyId(spotifyId);

    expect(cached?.lyrics).toBe(lyrics);
  });
});
