import { NextResponse } from "next/server";

import { isPoolServiceError } from "./errors";

export function poolErrorResponse(error: unknown) {
  if (isPoolServiceError(error)) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status }
    );
  }

  throw error;
}
