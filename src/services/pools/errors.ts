export class PoolServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string
  ) {
    super(message);
  }
}

export function isPoolServiceError(error: unknown): error is PoolServiceError {
  return error instanceof PoolServiceError;
}
