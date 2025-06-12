import { constructGeniusSearchQuery } from '../utils/genius';

// All fixture access is now by constant key only. No mapping helpers needed.

export const TEST_IDS = {
  SPOTIFY: {
    TRACKS: {
      // Real tracks that have lyrics and should have full fixtures
      WITH_LYRICS: {
        PARTY_IN_THE_USA: 'spotify:track:3E7dfMvvCLUddWissuqMwr',
        BABY_ONE_MORE_TIME: 'spotify:track:3MjUtNVVq3C8Fn0MP3zhXa',
        BILLIE_JEAN: 'spotify:track:7J1uxwnxfQLu4APicE5Rnj',
        LIKE_A_PRAYER: 'spotify:track:1z3ugFmUKoCzGsI6jdY4Ci',
        SWEET_CHILD_O_MINE: 'spotify:track:7snQQk1zcKl8gZ92AnueZW',
        BEAT_IT: 'spotify:track:1OOtq8tRnDM8kG2gqUPjAj',
        THRILLER: 'spotify:track:3S2R0EVwBSAVMd5UMgKTL0',
        // French Songs
        LA_VIE_EN_ROSE: 'spotify:track:4FmiciU3ZmfgABlbCSXcWw',
        NE_ME_QUITTE_PAS: 'spotify:track:6IRA4KOVbtiGiTdYoEThJN',
        LA_BOHEME: 'spotify:track:1WvvmEowf7hiz5EnyAwtTj',
        NON_JE_NE_REGRETTE_RIEN: 'spotify:track:3dkIE8P7hvl3tHl9KSb6dA',
        // New track with lyrics
        NEVER_GONNA_GIVE_YOU_UP: 'spotify:track:4uLU6hMCjMI75M1A2tKUQC',
      },
      
      // Real tracks without lyrics (instrumentals)
      INSTRUMENTAL: {
        INSTRUMENTAL_TRACK: 'spotify:track:3x0CWa9KGGfVH8dEby53PM',
        INSTRUMENTAL_2: 'spotify:track:2bgTY4UwhfBYhGT4HUYStN',
      }
    },
    
    // Error simulation cases - these get special fixtures
    ERROR_CASES: {
      NOT_FOUND: 'spotify:track:0123456789abcdefghijkl',
      INVALID_FORMAT: 'invalid-id',
    },
    
    PLAYLISTS: {
      ALL_OUT_80S_90S: 'spotify:playlist:141guhSLUNzE58MqlIC4zT',
      ROCK_CLASSICS: 'spotify:playlist:3sTZTkIGgm8wJiSXDvpApF',
      NINETIES_ROCK: 'spotify:playlist:2HfFccisPxQfprhgIHM7XH',
      FRENCH_CLASSICS: 'spotify:playlist:6EyNHMMJtumWbxWpWN5AJW',
    }
  },
  GENIUS: {
    QUERIES: {
      // Special Cases
      NO_RESULTS: 'dijnidfnlvinosd dsnlsdvnldsnsfvilnsvl sdsjn',
    },
    URLS: {
      // Special Cases
      NO_LYRICS: 'https://www.google.com'
    }
  }
} as const;

// Helper functions to work with the new structure
export const getAllTrackIds = () => {
  return {
    ...TEST_IDS.SPOTIFY.TRACKS.WITH_LYRICS,
    ...TEST_IDS.SPOTIFY.TRACKS.INSTRUMENTAL,
    ...TEST_IDS.SPOTIFY.ERROR_CASES
  };
};

export const isErrorCase = (id: string): boolean => {
  return Object.values(TEST_IDS.SPOTIFY.ERROR_CASES).includes(id as any);
};

export const isInstrumental = (id: string): boolean => {
  return Object.values(TEST_IDS.SPOTIFY.TRACKS.INSTRUMENTAL).includes(id as any);
};

export const TEST_DATES = {
  TODAY: new Date().toISOString().split('T')[0],
  PAST: '2023-12-25',
  FUTURE: '2024-12-25'
} as const;

export const TEST_PLAYERS = {
  DEFAULT: {
    id: 'test-player-1',
    name: 'Test Player'
  }
} as const;

// Helper to get the key name for a given error case ID
export function getErrorCaseKeyById(id: string): keyof typeof TEST_IDS.SPOTIFY.ERROR_CASES | undefined {
  return Object.keys(TEST_IDS.SPOTIFY.ERROR_CASES).find(
    k => TEST_IDS.SPOTIFY.ERROR_CASES[k as keyof typeof TEST_IDS.SPOTIFY.ERROR_CASES] === id
  ) as keyof typeof TEST_IDS.SPOTIFY.ERROR_CASES | undefined;
}

// Key constants for all tracks and playlists (for use in tests, fixtures, and mocks)
export const TRACK_KEYS = Object.freeze({
  PARTY_IN_THE_USA: 'PARTY_IN_THE_USA',
  BABY_ONE_MORE_TIME: 'BABY_ONE_MORE_TIME',
  BILLIE_JEAN: 'BILLIE_JEAN',
  LIKE_A_PRAYER: 'LIKE_A_PRAYER',
  SWEET_CHILD_O_MINE: 'SWEET_CHILD_O_MINE',
  BEAT_IT: 'BEAT_IT',
  THRILLER: 'THRILLER',
  LA_VIE_EN_ROSE: 'LA_VIE_EN_ROSE',
  NE_ME_QUITTE_PAS: 'NE_ME_QUITTE_PAS',
  LA_BOHEME: 'LA_BOHEME',
  NON_JE_NE_REGRETTE_RIEN: 'NON_JE_NE_REGRETTE_RIEN',
  INSTRUMENTAL_TRACK: 'INSTRUMENTAL_TRACK',
  INSTRUMENTAL_2: 'INSTRUMENTAL_2',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_FORMAT: 'INVALID_FORMAT',
} as const);

export const PLAYLIST_KEYS = Object.freeze({
  ALL_OUT_80S_90S: 'ALL_OUT_80S_90S',
  ROCK_CLASSICS: 'ROCK_CLASSICS',
  NINETIES_ROCK: 'NINETIES_ROCK',
  FRENCH_CLASSICS: 'FRENCH_CLASSICS',
} as const);

// Map keys to actual Spotify URIs (for use in generator or real API calls)
export const TRACK_URIS = Object.freeze({
  [TRACK_KEYS.PARTY_IN_THE_USA]: TEST_IDS.SPOTIFY.TRACKS.WITH_LYRICS.PARTY_IN_THE_USA,
  [TRACK_KEYS.BABY_ONE_MORE_TIME]: TEST_IDS.SPOTIFY.TRACKS.WITH_LYRICS.BABY_ONE_MORE_TIME,
  [TRACK_KEYS.BILLIE_JEAN]: TEST_IDS.SPOTIFY.TRACKS.WITH_LYRICS.BILLIE_JEAN,
  [TRACK_KEYS.LIKE_A_PRAYER]: TEST_IDS.SPOTIFY.TRACKS.WITH_LYRICS.LIKE_A_PRAYER,
  [TRACK_KEYS.SWEET_CHILD_O_MINE]: TEST_IDS.SPOTIFY.TRACKS.WITH_LYRICS.SWEET_CHILD_O_MINE,
  [TRACK_KEYS.BEAT_IT]: TEST_IDS.SPOTIFY.TRACKS.WITH_LYRICS.BEAT_IT,
  [TRACK_KEYS.THRILLER]: TEST_IDS.SPOTIFY.TRACKS.WITH_LYRICS.THRILLER,
  [TRACK_KEYS.LA_VIE_EN_ROSE]: TEST_IDS.SPOTIFY.TRACKS.WITH_LYRICS.LA_VIE_EN_ROSE,
  [TRACK_KEYS.NE_ME_QUITTE_PAS]: TEST_IDS.SPOTIFY.TRACKS.WITH_LYRICS.NE_ME_QUITTE_PAS,
  [TRACK_KEYS.LA_BOHEME]: TEST_IDS.SPOTIFY.TRACKS.WITH_LYRICS.LA_BOHEME,
  [TRACK_KEYS.NON_JE_NE_REGRETTE_RIEN]: TEST_IDS.SPOTIFY.TRACKS.WITH_LYRICS.NON_JE_NE_REGRETTE_RIEN,
  [TRACK_KEYS.INSTRUMENTAL_TRACK]: TEST_IDS.SPOTIFY.TRACKS.INSTRUMENTAL.INSTRUMENTAL_TRACK,
  [TRACK_KEYS.INSTRUMENTAL_2]: TEST_IDS.SPOTIFY.TRACKS.INSTRUMENTAL.INSTRUMENTAL_2,
  [TRACK_KEYS.NOT_FOUND]: TEST_IDS.SPOTIFY.ERROR_CASES.NOT_FOUND,
  [TRACK_KEYS.INVALID_FORMAT]: TEST_IDS.SPOTIFY.ERROR_CASES.INVALID_FORMAT,
} as const);

export const PLAYLIST_URIS = Object.freeze({
  [PLAYLIST_KEYS.ALL_OUT_80S_90S]: TEST_IDS.SPOTIFY.PLAYLISTS.ALL_OUT_80S_90S,
  [PLAYLIST_KEYS.ROCK_CLASSICS]: TEST_IDS.SPOTIFY.PLAYLISTS.ROCK_CLASSICS,
  [PLAYLIST_KEYS.NINETIES_ROCK]: TEST_IDS.SPOTIFY.PLAYLISTS.NINETIES_ROCK,
  [PLAYLIST_KEYS.FRENCH_CLASSICS]: TEST_IDS.SPOTIFY.PLAYLISTS.FRENCH_CLASSICS,
} as const); 