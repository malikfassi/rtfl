export const TEST_IDS = {
  SPOTIFY: {
    TRACKS: {
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
      // Special Cases
      INSTRUMENTAL_TRACK: 'spotify:track:3x0CWa9KGGfVH8dEby53PM',
      UNKNOWN_SONG: 'spotify:track:0123456789abcdefghijkl',
      INSTRUMENTAL: 'spotify:track:2bgTY4UwhfBYhGT4HUYStN',
      // Error Cases
      NONEXISTENT: 'spotify:track:0123456789abcdefghijkl',
      INVALID: 'invalid-id'
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