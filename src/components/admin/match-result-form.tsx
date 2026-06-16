"use client";

import { FormEvent, useState } from "react";

import { readJsonResponse } from "@/lib/http/client";

type MatchOption = {
  id: string;
  label: string;
  homeScore: number | null;
  awayScore: number | null;
  homePenaltyScore: number | null;
  awayPenaltyScore: number | null;
};

export function MatchResultForm({ matches }: { matches: MatchOption[] }) {
  const [selectedId, setSelectedId] = useState(matches[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedMatch = matches.find((match) => match.id === selectedId);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setIsSubmitting(true);
    setMessage(null);
    setIsError(false);

    const response = await fetch(`/api/admin/matches/${selectedId}/result`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        homeScore: parseNullableNumber(formData.get("homeScore")),
        awayScore: parseNullableNumber(formData.get("awayScore")),
        homePenaltyScore: parseNullableNumber(formData.get("homePenaltyScore")),
        awayPenaltyScore: parseNullableNumber(formData.get("awayPenaltyScore"))
      })
    });
    const payload = await readJsonResponse(response);

    if (!payload.ok) {
      setMessage(payload.message);
      setIsError(true);
      setIsSubmitting(false);
      return;
    }

    setMessage("Resultado registrado e reprocessado.");
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-brand-700">
          Resultados oficiais
        </p>
        <h2 className="mt-1 text-xl font-semibold text-ink">Registrar placar</h2>
      </div>

      <label className="mt-4 block text-sm font-medium text-stone-700">
        Partida
        <select
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          disabled={isSubmitting}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
        >
          {matches.map((match) => (
            <option key={match.id} value={match.id}>
              {match.label}
            </option>
          ))}
        </select>
      </label>

      <div key={selectedId} className="mt-4 grid gap-4 sm:grid-cols-4">
        <ScoreField name="homeScore" label="Mandante" defaultValue={selectedMatch?.homeScore} />
        <ScoreField name="awayScore" label="Visitante" defaultValue={selectedMatch?.awayScore} />
        <ScoreField
          name="homePenaltyScore"
          label="Pen. mandante"
          defaultValue={selectedMatch?.homePenaltyScore}
        />
        <ScoreField
          name="awayPenaltyScore"
          label="Pen. visitante"
          defaultValue={selectedMatch?.awayPenaltyScore}
        />
      </div>

      {message ? (
        <p
          className={`mt-4 rounded-md px-3 py-2 text-sm ${
            isError ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!selectedId || isSubmitting}
        className="mt-5 rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-400"
      >
        Salvar resultado
      </button>
    </form>
  );
}

function ScoreField({
  name,
  label,
  defaultValue
}: {
  name: string;
  label: string;
  defaultValue?: number | null;
}) {
  return (
    <label className="block text-sm font-medium text-stone-700">
      {label}
      <input
        key={`${name}-${defaultValue ?? ""}`}
        name={name}
        type="number"
        min={0}
        defaultValue={defaultValue ?? ""}
        className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
      />
    </label>
  );
}

function parseNullableNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? Number(text) : null;
}
