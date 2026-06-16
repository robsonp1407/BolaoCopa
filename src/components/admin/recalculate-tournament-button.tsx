"use client";

import { useState } from "react";

import { readJsonResponse } from "@/lib/http/client";

export function RecalculateTournamentButton() {
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function recalculate() {
    setIsSubmitting(true);
    setMessage(null);
    setIsError(false);

    const response = await fetch("/api/admin/tournaments/world-cup-2026/recalculate", {
      method: "POST"
    });
    const payload = await readJsonResponse(response);

    if (!payload.ok) {
      setMessage(payload.message);
      setIsError(true);
      setIsSubmitting(false);
      return;
    }

    setMessage("Torneio reprocessado com sucesso.");
    setIsSubmitting(false);
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-wide text-brand-700">
        Reprocessamento
      </p>
      <h2 className="mt-1 text-xl font-semibold text-ink">Chaveamento da Copa</h2>
      <p className="mt-3 text-sm text-stone-600">
        Recalcula classificacao de grupos, qualificadores e confrontos derivados.
      </p>
      <button
        type="button"
        onClick={recalculate}
        disabled={isSubmitting}
        className="mt-5 rounded-md border border-brand-700 px-4 py-2 text-sm font-semibold text-brand-700 disabled:cursor-not-allowed disabled:border-stone-300 disabled:text-stone-400"
      >
        Reprocessar torneio
      </button>
      {message ? (
        <p
          className={`mt-4 rounded-md px-3 py-2 text-sm ${
            isError ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
