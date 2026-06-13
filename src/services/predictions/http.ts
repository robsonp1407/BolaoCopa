import { NextResponse } from "next/server";

import { isPredictionServiceError } from "./errors";

export function predictionErrorResponse(error: unknown) {
  if (isPredictionServiceError(error)) {
    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details },
      { status: error.status }
    );
  }

  throw error;
}
