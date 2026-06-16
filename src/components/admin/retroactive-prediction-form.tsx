"use client";

import { FormEvent, useMemo, useState } from "react";

import { readJsonResponse } from "@/lib/http/client";

type PoolOption = {
  id: string;
  name: string;
};

type UserOption = {
  id: string;
  label: string;
};

type MatchOption = {
  id: string;
  label: string;
};

export function RetroactivePredictionForm({
  pools,
  users,
  matches
}: {
  pools: PoolOption[];
  users: UserOption[];
  matches: MatchOption[];
}) {
  const [poolId, setPoolId] = useState(pools[0]?.id ?? "");
  const [userId, setUserId] = useState(users[0]?.id ?? "");
  const [matchId, setMatchId] = useState(matches[0]?.id ?? "");
  const [userFilter, setUserFilter] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredUsers = useMemo(() => {
    const filter = userFilter.trim().toLowerCase();

    if (!filter) {
      return users;
    }

    return users.filter((user) => user.label.toLowerCase().includes(filter));
  }, [userFilter, users]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !window.confirm(
        "Voce tem certeza que deseja inserir um palpite retroativo para este jogo iniciado?"
      )
    ) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setMessage(null);
    setIsError(false);

    const response = await fetch("/api/admin/retroactive-guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        pool_id: poolId,
        match_id: matchId,
        home_score: Number(formData.get("homeScore")),
        away_score: Number(formData.get("awayScore"))
      })
    });
    const payload = await readJsonResponse(response);

    if (!payload.ok) {
      setMessage(payload.message);
      setIsError(true);
      setIsSubmitting(false);
      return;
    }

    setMessage("Palpite retroativo salvo e pontuacao reprocessada quando aplicavel.");
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-brand-700">
          Entrada retroativa
        </p>
        <h2 className="mt-1 text-xl font-semibold text-ink">
          Salvar palpite iniciado
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Uso emergencial exclusivo de ADMIN. Toda acao gera auditoria.
        </p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-stone-700">
          Bolao
          <select
            value={poolId}
            onChange={(event) => setPoolId(event.target.value)}
            disabled={isSubmitting}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
          >
            {pools.map((pool) => (
              <option key={pool.id} value={pool.id}>
                {pool.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-stone-700">
          Filtrar participante
          <input
            value={userFilter}
            onChange={(event) => setUserFilter(event.target.value)}
            disabled={isSubmitting}
            placeholder="Nome ou e-mail"
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-medium text-stone-700">
        Participante
        <select
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          disabled={isSubmitting}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
        >
          {filteredUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.label}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block text-sm font-medium text-stone-700">
        Jogo
        <select
          value={matchId}
          onChange={(event) => setMatchId(event.target.value)}
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

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ScoreField name="homeScore" label="Placar mandante" />
        <ScoreField name="awayScore" label="Placar visitante" />
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
        disabled={!poolId || !userId || !matchId || isSubmitting}
        className="mt-5 rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-400"
      >
        Salvar Palpite Retroativo
      </button>
    </form>
  );
}

function ScoreField({ name, label }: { name: string; label: string }) {
  return (
    <label className="block text-sm font-medium text-stone-700">
      {label}
      <input
        name={name}
        type="number"
        min={0}
        required
        className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
      />
    </label>
  );
}
