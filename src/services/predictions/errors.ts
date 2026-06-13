export class PredictionServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly details?: unknown
  ) {
    super(message);
  }
}

export function isPredictionServiceError(
  error: unknown
): error is PredictionServiceError {
  return error instanceof PredictionServiceError;
}
