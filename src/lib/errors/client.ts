import { AppError } from './base';

export class ClientError extends AppError {
  constructor(message: string) {
    super('CLIENT_ERROR', message, 500);
  }
}

export class FetchError extends ClientError {
  constructor(resource: string) {
    super(`Failed to fetch ${resource}`);
  }
}

export class GameFetchError extends FetchError {
  constructor() {
    super('games');
  }
}

export class PlaylistFetchError extends FetchError {
  constructor() {
    super('playlists');
  }
}

export class TrackFetchError extends FetchError {
  constructor() {
    super('tracks');
  }
}

export class GameMutationError extends ClientError {
  constructor(operation: string) {
    super(`Failed to ${operation} game`);
  }
}

export class GameCreationError extends GameMutationError {
  constructor() {
    super('create');
  }
}

export class GameUpdateError extends GameMutationError {
  constructor() {
    super('update');
  }
}

export class GameDeletionError extends GameMutationError {
  constructor() {
    super('delete');
  }
} 