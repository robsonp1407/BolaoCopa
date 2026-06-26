import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { rankingQuerySchema } from "@/lib/validations/ranking";
import { getPoolRanking } from "@/services/rankings/get-ranking";

export const dynamic = "force-dynamic";

type RankingsPageProps = {
  params: Promise<{ poolId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const scopeLinks = [
  { label: "Geral", scope: "GENERAL", scopeKey: "ALL" },
  { label: "Rodada 1", scope: "GROUP_ROUND", scopeKey: "ROUND_1" },
  { label: "Rodada 2", scope: "GROUP_ROUND", scopeKey: "ROUND_2" },
  { label: "Rodada 3", scope: "GROUP_ROUND", scopeKey: "ROUND_3" },
  { label: "Final", scope: "KNOCKOUT_STAGE", scopeKey: "FINAL" }
] as const;

export default async function RankingsPage({
  params,
  searchParams
}: RankingsPageProps) {
  const session = await auth();

  if (!session?.user.id) {
    redirect("/login");
  }

  const { poolId } = await params;
  const query = await searchParams;
  const parsedQuery = rankingQuerySchema.parse({
    scope: readQueryValue(query.scope),
    scopeKey: readQueryValue(query.scopeKey),
    page: readQueryValue(query.page),
    pageSize: readQueryValue(query.pageSize)
  });

  const ranking = await getPoolRanking(prisma, {
    poolId,
    userId: session.user.id,
    ...parsedQuery
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-brand-700">
            Ranking
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ink">
            {ranking.pool.name}
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Snapshot calculado por pontuacao, placares exatos, resultados
            corretos e palpite mais antigo. As metricas adicionais mostram
            desempenho e volume de palpites no escopo selecionado.
          </p>
        </div>
        <Link
          className="rounded-md border border-brand-700 px-4 py-2 text-sm font-semibold text-brand-700"
          href={`/pools/${poolId}`}
        >
          Voltar ao bolao
        </Link>
      </div>

      <nav className="mt-6 flex flex-wrap gap-2">
        {scopeLinks.map((item) => {
          const active =
            item.scope === parsedQuery.scope &&
            item.scopeKey === parsedQuery.scopeKey;

          return (
            <Link
              key={`${item.scope}-${item.scopeKey}`}
              href={`/pools/${poolId}/rankings?scope=${item.scope}&scopeKey=${item.scopeKey}`}
              className={`rounded-md px-3 py-2 text-sm font-semibold ${
                active
                  ? "bg-brand-700 text-white"
                  : "border border-stone-300 text-stone-700"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Partidas no ranking
          </p>
          <p className="mt-2 text-2xl font-bold text-ink">
            {ranking.scopeStats.totalMatches}
          </p>
        </div>
        <div className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Palpites registrados
          </p>
          <p className="mt-2 text-2xl font-bold text-ink">
            {ranking.scopeStats.totalPredictions}
          </p>
        </div>
      </section>

      <section className="mt-6 overflow-x-auto rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[70px_1fr_90px_90px_110px_100px_110px_90px] gap-3 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-700">
            <span>Pos.</span>
            <span>Participante</span>
            <span>Pontos</span>
            <span>Exatos</span>
            <span>Resultados</span>
            <span>1 placar</span>
            <span>Sem pontos</span>
            <span>Palpites</span>
          </div>
          {ranking.ranking.length > 0 ? (
            ranking.ranking.map((entry) => (
              <div
                key={entry.id}
                className="grid grid-cols-[70px_1fr_90px_90px_110px_100px_110px_90px] gap-3 border-t border-stone-100 px-4 py-3 text-sm"
              >
                <span className="font-semibold text-ink">
                  #{entry.position}
                </span>
                <span className="text-stone-700">
                  {entry.user.name ?? entry.user.email}
                </span>
                <span>{entry.totalPoints}</span>
                <span>{entry.exactScoreHits}</span>
                <span>{entry.resultHits}</span>
                <span>{entry.predictionStats.singleTeamScoreHits}</span>
                <span>{entry.predictionStats.noPointPredictions}</span>
                <span>{entry.predictionStats.predictionsCount}</span>
              </div>
            ))
          ) : (
            <p className="border-t border-stone-100 px-4 py-6 text-sm text-stone-600">
              Ainda nao ha snapshot para este ranking. Ele sera preenchido apos
              o registro de resultados e recalculo de pontos.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

function readQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
