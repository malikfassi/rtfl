// English Songs
export const SONG_IDS = {
  // English Songs
  PARTY_IN_THE_USA: '3E7dfMvvCLUddWissuqMwr',
  BABY_ONE_MORE_TIME: '3MjUtNVVq3C8Fn0MP3zhXa',
  BILLIE_JEAN: '7J1uxwnxfQLu4APicE5Rnj',
  LIKE_A_PRAYER: '1z3ugFmUKoCzGsI6jdY4Ci',
  SWEET_CHILD_O_MINE: '7snQQk1zcKl8gZ92AnueZW',
  BEAT_IT: '1OOtq8tRnDM8kG2gqUPjAj',
  THRILLER: '3S2R0EVwBSAVMd5UMgKTL0',
  
  // French Songs
  LA_VIE_EN_ROSE: '4FmiciU3ZmfgABlbCSXcWw', // Edith Piaf
  NE_ME_QUITTE_PAS: '6IRA4KOVbtiGiTdYoEThJN', // Jacques Brel
  LA_BOHEME: '1WvvmEowf7hiz5EnyAwtTj', // Charles Aznavour
  NON_JE_NE_REGRETTE_RIEN: '3dkIE8P7hvl3tHl9KSb6dA', // Edith Piaf
  
  // Special Cases
  INSTRUMENTAL_TRACK: '3x0CWa9KGGfVH8dEby53PM',
  UNKNOWN_SONG: '0123456789abcdefghijkl',
  VALID: '3E7dfMvvCLUddWissuqMwr',
  FRENCH: '2bgTY4UwhfBYhGT4HUYStN',
  INSTRUMENTAL: '2bgTY4UwhfBYhGT4HUYStN'
} as const;

// Playlists
export const PLAYLIST_IDS = {
  ALL_OUT_80S_90S: '141guhSLUNzE58MqlIC4zT',
  ROCK_CLASSICS: '3sTZTkIGgm8wJiSXDvpApF',
  NINETIES_ROCK: '2HfFccisPxQfprhgIHM7XH',
  FRENCH_CLASSICS: '6EyNHMMJtumWbxWpWN5AJW',
  INVALID_PLAYLIST: 'invalid_playlist_id',
  VALID: '37i9dQZF1DX4sWSpwq3LiO'
} as const;

export type SpotifyId = typeof SONG_IDS[keyof typeof SONG_IDS];
export type PlaylistId = typeof PLAYLIST_IDS[keyof typeof PLAYLIST_IDS]; 