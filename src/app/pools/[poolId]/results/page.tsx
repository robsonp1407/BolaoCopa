import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { listComputedPoolResults } from "@/services/results/list-computed-pool-results";

export const dynamic = "force-dynamic";

type ResultsPageProps = {
  params: Promise<{ poolId: string }>;
};

export default async function ResultsPage({ params }: ResultsPageProps) {
  const session = await auth();

  if (!session?.user.id) {
    redirect("/login");
  }

  const { poolId } = await params;
  const results = await listComputedPoolResults(prisma, {
    poolId,
    userId: session.user.id
  });
  const groupedItems = groupResultsByStageAndDate(results.items);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-brand-700">
            Resultados oficiais
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ink">
            {results.pool.name}
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Partidas com placar oficial registrado e pontuacao ja computada
            neste bolao.
          </p>
        </div>
        <Link
          className="rounded-md border border-brand-700 px-4 py-2 text-sm font-semibold text-brand-700"
          href={`/pools/${poolId}`}
        >
          Voltar ao bolao
        </Link>
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <SummaryBox
          label="Partidas computadas"
          value={results.summary.computedMatches}
        />
        <SummaryBox
          label="Palpites computados"
          value={results.summary.computedPredictions}
        />
        <SummaryBox
          label="Pontos distribuidos"
          value={results.summary.distributedPoints}
        />
      </section>

      {results.items.length === 0 ? (
        <p className="mt-6 rounded-lg border border-stone-200 bg-white px-4 py-6 text-sm text-stone-600 shadow-sm">
          Ainda nao ha partidas com resultado oficial computado na pontuacao
          deste bolao.
        </p>
      ) : (
        <div className="mt-8 space-y-8">
          {groupedItems.map(([groupName, items]) => (
            <section key={groupName} className="space-y-3">
              <h2 className="text-lg font-semibold text-ink">{groupName}</h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <article
                    key={item.match.id}
                    className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
                  >
                    <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto] lg:items-center">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                          Jogo {item.match.matchNumber}
                        </p>
                        <p className="mt-1 text-base font-semibold text-ink">
                          {formatTeam(item.match.homeTeam, item.match.homeSlot)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-lg font-bold text-ink">
                        <span>{item.match.homeScore}</span>
                        <span className="text-stone-400">x</span>
                        <span>{item.match.awayScore}</span>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                          Visitante
                        </p>
                        <p className="mt-1 text-base font-semibold text-ink">
                          {formatTeam(item.match.awayTeam, item.match.awaySlot)}
                        </p>
                      </div>

                      <div className="grid gap-1 text-sm text-stone-600 lg:text-right">
                        <span>{item.computedPredictions} palpites</span>
                        <span className="font-semibold text-ink">
                          {item.distributedPoints} pts
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-stone-600">
                      <span>{formatDateTime(item.match.startsAt)}</span>
                      {item.match.group ? (
                        <span>Grupo {item.match.group.code}</span>
                      ) : null}
                      {formatPenaltyScore(item) ? (
                        <span>{formatPenaltyScore(item)}</span>
                      ) : null}
                      <span>
                        Pontos calculados em{" "}
                        {formatDateTime(item.lastCalculatedAt)}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
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

function groupResultsByStageAndDate<
  T extends { match: { stage: { name: string }; startsAt: Date | null } }
>(items: T[]) {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const dateLabel = item.match.startsAt
      ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(
          item.match.startsAt
        )
      : "Data a definir";
    const key = `${item.match.stage.name} - ${dateLabel}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return Array.from(groups.entries());
}

function formatTeam(
  team: { name: string; flagEmoji: string | null } | null,
  slot: string | null
) {
  if (!team) {
    return slot ?? "A definir";
  }

  return [team.flagEmoji, team.name].filter(Boolean).join(" ");
}

function formatDateTime(value: Date | null) {
  if (!value) {
    return "Horario a definir";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(value);
}

function formatPenaltyScore(item: {
  match: {
    homePenaltyScore: number | null;
    awayPenaltyScore: number | null;
  };
}) {
  if (
    item.match.homePenaltyScore === null ||
    item.match.awayPenaltyScore === null
  ) {
    return null;
  }

  return `Penaltis: ${item.match.homePenaltyScore} x ${item.match.awayPenaltyScore}`;
}
