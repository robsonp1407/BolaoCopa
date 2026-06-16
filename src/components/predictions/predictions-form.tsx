"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Team = {
  id: string;
  name: string;
  flagEmoji: string | null;
};

type PredictionFields = {
  homeScore: number | null;
  awayScore: number | null;
  homePenaltyScore: number | null;
  awayPenaltyScore: number | null;
  predictedWinnerTeamId: string | null;
};

type PredictionItem = {
  match: {
    id: string;
    matchNumber: number;
    startsAt: string | null;
    homeSlot: string | null;
    awaySlot: string | null;
    stage: { name: string; isKnockout: boolean };
    group: { code: string; name: string } | null;
    homeTeam: Team | null;
    awayTeam: Team | null;
    stadium: {
      name: string;
      city: { name: string; country: string };
    } | null;
  };
  prediction: (PredictionFields & { id: string }) | null;
  isOpen: boolean;
  isLocked: boolean;
  isPending: boolean;
};

type PredictionsResponse = {
  pool: { id: string; name: string };
  summary: {
    totalGames: number;
    totalAvailable: number;
    totalFilled: number;
    totalPending: number;
    totalLocked: number;
  };
  items: PredictionItem[];
};

type PredictionsFormProps = {
  poolId: string;
};

export function PredictionsForm({ poolId }: PredictionsFormProps) {
  const [data, setData] = useState<PredictionsResponse | null>(null);
  const [fields, setFields] = useState<Record<string, PredictionFields>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadPredictions = useCallback(async () => {
    setIsLoading(true);
    const response = await fetch(`/api/pools/${poolId}/predictions`);
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Nao foi possivel carregar os palpites");
      setIsLoading(false);
      return;
    }

    setData(payload);
    setFields(buildInitialFields(payload.items));
    setIsLoading(false);
  }, [poolId]);

  useEffect(() => {
    void loadPredictions();
  }, [loadPredictions]);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, PredictionItem[]>();

    for (const item of data?.items ?? []) {
      const dateLabel = item.match.startsAt
        ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(
            new Date(item.match.startsAt)
          )
        : "Data a definir";
      const key = `${item.match.stage.name} - ${dateLabel}`;
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }

    return Array.from(groups.entries());
  }, [data?.items]);

  function updateField(
    matchId: string,
    field: keyof PredictionFields,
    value: number | string | null
  ) {
    setFields((current) => ({
      ...current,
      [matchId]: {
        ...current[matchId],
        [field]: value === "" ? null : value
      }
    }));
  }

  async function savePrediction(matchId: string) {
    const currentFields = fields[matchId];

    if (!currentFields) {
      setMessage("Palpite nao encontrado na tela");
      return;
    }

    if (currentFields.homeScore === null || currentFields.awayScore === null) {
      setMessage("Informe o placar antes de salvar o palpite");
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const response = await fetch(`/api/pools/${poolId}/predictions/${matchId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizeFields(currentFields))
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Nao foi possivel salvar o palpite");
      setIsSaving(false);
      return;
    }

    setMessage("Palpite salvo");
    await loadPredictions();
    setIsSaving(false);
  }

  async function quickSave() {
    setIsSaving(true);
    setMessage(null);

    const predictions = Object.entries(fields)
      .filter(([matchId]) => data?.items.find((item) => item.match.id === matchId)?.isOpen)
      .filter(([, field]) => field.homeScore !== null && field.awayScore !== null)
      .map(([matchId, field]) => ({ matchId, ...normalizeFields(field) }));

    const response = await fetch(`/api/pools/${poolId}/predictions/quick`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ predictions })
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Nao foi possivel salvar os palpites");
      setIsSaving(false);
      return;
    }

    setMessage("Palpites salvos");
    await loadPredictions();
    setIsSaving(false);
  }

  if (isLoading) {
    return <p className="text-sm text-stone-600">Carregando palpites...</p>;
  }

  if (!data) {
    return <p className="text-sm text-red-700">{message}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-brand-700">
            Palpites
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ink">{data.pool.name}</h1>
        </div>
        <button
          type="button"
          onClick={quickSave}
          disabled={isSaving}
          className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-400"
        >
          Salvar preenchidos
        </button>
      </div>

      <section className="grid gap-3 sm:grid-cols-4">
        <SummaryBox label="Disponiveis" value={data.summary.totalAvailable} />
        <SummaryBox label="Preenchidos" value={data.summary.totalFilled} />
        <SummaryBox label="Pendentes" value={data.summary.totalPending} />
        <SummaryBox label="Bloqueados" value={data.summary.totalLocked} />
      </section>

      {message ? (
        <p className="rounded-md border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
          {message}
        </p>
      ) : null}

      <div className="space-y-8">
        {groupedItems.map(([groupName, items]) => (
          <section key={groupName} className="space-y-3">
            <h2 className="text-lg font-semibold text-ink">{groupName}</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <PredictionRow
                  key={item.match.id}
                  item={item}
                  fields={fields[item.match.id]}
                  isSaving={isSaving}
                  onChange={updateField}
                  onSave={savePrediction}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function PredictionRow({
  item,
  fields,
  isSaving,
  onChange,
  onSave
}: {
  item: PredictionItem;
  fields?: PredictionFields;
  isSaving: boolean;
  onChange: (
    matchId: string,
    field: keyof PredictionFields,
    value: number | string | null
  ) => void;
  onSave: (matchId: string) => void;
}) {
  const homeTeam = formatTeam(item.match.homeTeam, item.match.homeSlot);
  const awayTeam = formatTeam(item.match.awayTeam, item.match.awaySlot);
  const isDraw =
    fields?.homeScore !== null &&
    fields?.awayScore !== null &&
    fields?.homeScore === fields?.awayScore;
  const showWinnerSelect = item.match.stage.isKnockout && isDraw;

  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto] lg:items-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Jogo {item.match.matchNumber}
          </p>
          <p className="mt-1 text-base font-semibold text-ink">{homeTeam}</p>
        </div>

        <div className="flex items-center gap-2">
          <ScoreInput
            value={fields?.homeScore ?? null}
            disabled={!item.isOpen}
            onChange={(value) => onChange(item.match.id, "homeScore", value)}
          />
          <span className="text-stone-400">x</span>
          <ScoreInput
            value={fields?.awayScore ?? null}
            disabled={!item.isOpen}
            onChange={(value) => onChange(item.match.id, "awayScore", value)}
          />
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Visitante
          </p>
          <p className="mt-1 text-base font-semibold text-ink">{awayTeam}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <span
            className={`rounded-md px-2 py-1 text-xs font-semibold ${
              item.isLocked
                ? "bg-stone-200 text-stone-700"
                : item.isPending
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {item.isLocked ? "Bloqueado" : item.isPending ? "Pendente" : "Salvo"}
          </span>
          <button
            type="button"
            onClick={() => onSave(item.match.id)}
            disabled={!item.isOpen || isSaving}
            className="rounded-md border border-brand-700 px-3 py-2 text-sm font-semibold text-brand-700 disabled:cursor-not-allowed disabled:border-stone-300 disabled:text-stone-400"
          >
            Salvar
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-sm text-stone-600">
        <span>{formatDateTime(item.match.startsAt)}</span>
        {item.match.group ? <span>Grupo {item.match.group.code}</span> : null}
        {item.match.stadium ? (
          <span>
            {item.match.stadium.name}, {item.match.stadium.city.name}
          </span>
        ) : null}
      </div>

      {showWinnerSelect ? (
        <div className="mt-4 grid gap-4 md:grid-cols-[auto_1fr]">
          <div>
            <p className="text-sm font-medium text-stone-700">Penaltis</p>
            <div className="mt-1 flex items-center gap-2">
              <ScoreInput
                value={fields?.homePenaltyScore ?? null}
                disabled={!item.isOpen}
                onChange={(value) =>
                  onChange(item.match.id, "homePenaltyScore", value)
                }
              />
              <span className="text-stone-400">x</span>
              <ScoreInput
                value={fields?.awayPenaltyScore ?? null}
                disabled={!item.isOpen}
                onChange={(value) =>
                  onChange(item.match.id, "awayPenaltyScore", value)
                }
              />
            </div>
          </div>
          <div className="max-w-sm">
            <label className="text-sm font-medium text-stone-700">
              Vencedor previsto
            </label>
            <select
              value={fields?.predictedWinnerTeamId ?? ""}
              onChange={(event) =>
                onChange(
                  item.match.id,
                  "predictedWinnerTeamId",
                  event.target.value || null
                )
              }
              disabled={!item.isOpen}
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            >
              <option value="">Selecione</option>
              {item.match.homeTeam ? (
                <option value={item.match.homeTeam.id}>{homeTeam}</option>
              ) : null}
              {item.match.awayTeam ? (
                <option value={item.match.awayTeam.id}>{awayTeam}</option>
              ) : null}
            </select>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function ScoreInput({
  value,
  disabled,
  onChange
}: {
  value: number | null;
  disabled: boolean;
  onChange: (value: number | null) => void;
}) {
  return (
    <input
      type="number"
      min={0}
      value={value ?? ""}
      disabled={disabled}
      onChange={(event) =>
        onChange(event.target.value === "" ? null : Number(event.target.value))
      }
      className="h-10 w-16 rounded-md border border-stone-300 px-2 text-center text-sm font-semibold disabled:bg-stone-100"
    />
  );
}

function SummaryBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}

function buildInitialFields(items: PredictionItem[]) {
  return Object.fromEntries(
    items.map((item) => [
      item.match.id,
      {
        homeScore: item.prediction?.homeScore ?? null,
        awayScore: item.prediction?.awayScore ?? null,
        homePenaltyScore: item.prediction?.homePenaltyScore ?? null,
        awayPenaltyScore: item.prediction?.awayPenaltyScore ?? null,
        predictedWinnerTeamId: item.prediction?.predictedWinnerTeamId ?? null
      }
    ])
  );
}

function normalizeFields(fields: PredictionFields) {
  if (fields.homeScore === null || fields.awayScore === null) {
    throw new Error("Placar incompleto");
  }

  return {
    homeScore: fields.homeScore,
    awayScore: fields.awayScore,
    homePenaltyScore: fields.homePenaltyScore,
    awayPenaltyScore: fields.awayPenaltyScore,
    predictedWinnerTeamId: fields.predictedWinnerTeamId
  };
}

function formatTeam(team: Team | null, slot: string | null) {
  if (!team) {
    return slot ?? "A definir";
  }

  return [team.flagEmoji, team.name].filter(Boolean).join(" ");
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Horario a definir";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}
