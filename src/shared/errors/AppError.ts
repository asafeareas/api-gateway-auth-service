/**
 * Base application error class
 * All custom errors should extend this class
 * Provides consistent error structure across the application
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);

    // Set prototype explicitly for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Bad Request Error (400)
 * Used for validation errors and invalid input
 */
export class BadRequestError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 400, code);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

/**
 * Unauthorized Error (401)
 * Used when authentication is required or failed
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', code?: string) {
    super(message, 401, code);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * Forbidden Error (403)
 * Used when user is authenticated but lacks permission
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', code?: string) {
    super(message, 403, code);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * Not Found Error (404)
 * Used when resource is not found
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', code?: string) {
    super(message, 404, code);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Conflict Error (409)
 * Used when resource already exists or conflicts
 */
export class ConflictError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 409, code);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Too Many Requests Error (429)
 * Used when rate limit is exceeded
 */
export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Rate limit exceeded', code?: string) {
    super(message, 429, code);
    Object.setPrototypeOf(this, TooManyRequestsError.prototype);
  }
}

/**
 * Internal Server Error (500)
 * Used for unexpected server errors
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', code?: string) {
    super(message, 500, code);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

