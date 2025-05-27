import { spotifyValidator } from './spotify-client';
import { geniusValidator } from './genius-client';

export const integration_validator = {
  spotify_client: spotifyValidator,
  genius_client: geniusValidator
}; 