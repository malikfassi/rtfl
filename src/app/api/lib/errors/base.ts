export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message
    };
  }
}

export class ValidationError extends AppError {
  static readonly code = 'VALIDATION_ERROR';
  static readonly message = 'Validation error';

  constructor(message: string = ValidationError.message) {
    super(ValidationError.code, message, 400);
  }
}

export class NotFoundError extends AppError {
  static readonly code = 'NOT_FOUND';
  static readonly message = 'Not found';

  constructor(code: string = NotFoundError.code, message: string = NotFoundError.message) {
    super(code, message, 404);
  }
}

export class InternalError extends AppError {
  static readonly code = 'INTERNAL_ERROR';
  static readonly message = 'Internal error';

  constructor(message: string = InternalError.message) {
    super(InternalError.code, message, 500);
  }
}

