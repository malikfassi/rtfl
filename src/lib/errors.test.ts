import {
  APIError,
  BaseError,
  ErrorCode,
  GameNotFoundError,
  GeniusAuthError,
  InvalidWordError,
  RateLimitError,
  SpotifyAuthError,
  ValidationError,
} from './errors';

describe('Error Classes', () => {
  it('should create a BaseError with correct properties', () => {
    const error = new BaseError(ErrorCode.API_ERROR, 'Test error', 500, true);
    expect(error.code).toBe(ErrorCode.API_ERROR);
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.retryable).toBe(true);
    expect(error).toBeInstanceOf(Error);
  });

  it('should create an APIError with default values', () => {
    const error = new APIError();
    expect(error.code).toBe(ErrorCode.API_ERROR);
    expect(error.message).toBe('API Error');
    expect(error.statusCode).toBe(500);
    expect(error.retryable).toBe(false);
  });

  it('should create a RateLimitError with retry information', () => {
    const error = new RateLimitError('Spotify', 30);
    expect(error.code).toBe(ErrorCode.RATE_LIMITED);
    expect(error.message).toBe('Rate limit exceeded for Spotify. Try again after 30 seconds');
    expect(error.statusCode).toBe(429);
    expect(error.retryable).toBe(true);
  });

  it('should create a ValidationError', () => {
    const error = new ValidationError('Invalid input');
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.message).toBe('Invalid input');
    expect(error.statusCode).toBe(400);
    expect(error.retryable).toBe(false);
  });

  it('should create a SpotifyAuthError', () => {
    const error = new SpotifyAuthError();
    expect(error.code).toBe(ErrorCode.SPOTIFY_AUTH_ERROR);
    expect(error.message).toBe('Spotify authentication failed');
    expect(error.statusCode).toBe(401);
  });

  it('should create a GeniusAuthError', () => {
    const error = new GeniusAuthError();
    expect(error.code).toBe(ErrorCode.GENIUS_AUTH_ERROR);
    expect(error.message).toBe('Genius authentication failed');
    expect(error.statusCode).toBe(401);
  });

  it('should create a GameNotFoundError', () => {
    const error = new GameNotFoundError('2024-01-14');
    expect(error.code).toBe(ErrorCode.GAME_NOT_FOUND);
    expect(error.message).toBe('Game not found for date: 2024-01-14');
    expect(error.statusCode).toBe(404);
  });

  it('should create an InvalidWordError', () => {
    const error = new InvalidWordError('test');
    expect(error.code).toBe(ErrorCode.INVALID_WORD);
    expect(error.message).toBe('Invalid word: test');
    expect(error.statusCode).toBe(400);
  });
});
