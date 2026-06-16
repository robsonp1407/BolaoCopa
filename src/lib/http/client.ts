export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; status: number };

export async function readJsonResponse<T>(response: Response): Promise<ApiResult<T>> {
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: extractErrorMessage(payload) ?? "Nao foi possivel concluir a acao."
    };
  }

  return { ok: true, data: payload as T };
}

function extractErrorMessage(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return null;
}
