import { spotifyValidator } from './spotify-client';
import { geniusValidator } from './genius-client';
import { lyricsService } from './lyrics-service';
import { spotifyService } from './spotify-service';
import { geniusService } from './genius-service';
import { songService } from './song-service';
import { gameService } from './game-service';
import { guessService } from './guess-service';
import { gameStateService } from './game-state-service';
import { maskedLyricsService } from './masked-lyrics-service';

export const integration_validator = {
  spotify_client: spotifyValidator,
  genius_client: geniusValidator,
  // Services
  lyrics_service: lyricsService,
  spotify_service: spotifyService,
  genius_service: geniusService,
  song_service: songService,
  game_service: gameService,
  guess_service: guessService,
  game_state_service: gameStateService,
  masked_lyrics_service: maskedLyricsService
}; 