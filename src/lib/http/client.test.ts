import { describe, expect, it } from "vitest";

import { readJsonResponse } from "./client";

describe("readJsonResponse", () => {
  it("returns parsed json for successful responses", async () => {
    const result = await readJsonResponse<{ ok: boolean }>(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    expect(result).toEqual({ ok: true, data: { ok: true } });
  });

  it("returns api error message when available", async () => {
    const result = await readJsonResponse(
      new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { "content-type": "application/json" }
      })
    );

    expect(result).toEqual({
      ok: false,
      status: 403,
      message: "Acesso negado"
    });
  });

  it("returns fallback message for non-json errors", async () => {
    const result = await readJsonResponse(
      new Response("<html>erro</html>", {
        status: 500,
        headers: { "content-type": "text/html" }
      })
    );

    expect(result).toEqual({
      ok: false,
      status: 500,
      message: "Nao foi possivel concluir a acao."
    });
  });
});
