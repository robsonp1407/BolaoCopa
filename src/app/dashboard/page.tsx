import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user.id) {
    redirect("/login");
  }

  const now = new Date();
  const [allMemberships, createdPools, openMatches, rankingPositions] =
    await Promise.all([
      prisma.poolMember.findMany({
        where: {
          userId: session.user.id,
          pool: { status: "ACTIVE" }
        },
        include: {
          pool: {
            include: {
              _count: { select: { members: true } }
            }
          }
        },
        orderBy: { joinedAt: "desc" }
      }),
      prisma.pool.count({
        where: {
          ownerId: session.user.id,
          status: "ACTIVE"
        }
      }),
      prisma.match.findMany({
        where: {
          OR: [{ startsAt: null }, { startsAt: { gt: now } }]
        },
        select: { id: true }
      }),
      prisma.rankingSnapshot.findMany({
        where: {
          userId: session.user.id,
          scope: "GENERAL",
          scopeKey: "ALL"
        },
        include: {
          pool: {
            select: { id: true, name: true }
          }
        },
        orderBy: { position: "asc" },
        take: 3
      })
    ]);
  const visibleMemberships = allMemberships.slice(0, 5);
  const poolIds = allMemberships.map((membership) => membership.poolId);
  const openMatchIds = openMatches.map((match) => match.id);
  const filledOpenPredictions =
    poolIds.length > 0 && openMatchIds.length > 0
      ? await prisma.prediction.count({
          where: {
            userId: session.user.id,
            poolId: { in: poolIds },
            matchId: { in: openMatchIds }
          }
        })
      : 0;
  const pendingPredictions = Math.max(
    poolIds.length * openMatchIds.length - filledOpenPredictions,
    0
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-brand-700">
            Painel operacional
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ink">
            Ola, {session.user.name ?? "apostador"}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
            href="/pools"
          >
            Ver boloes
          </Link>
          {session.user.role === "ADMIN" ? (
            <Link
              className="rounded-md border border-brand-700 px-4 py-2 text-sm font-semibold text-brand-700"
              href="/admin"
            >
              Admin
            </Link>
          ) : null}
        </div>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-stone-500">Nome</p>
          <p className="mt-2 break-words text-lg font-semibold text-ink">
            {session.user.name ?? "Nao informado"}
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-stone-500">E-mail</p>
          <p className="mt-2 break-words text-lg font-semibold text-ink">
            {session.user.email}
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-stone-500">Papel</p>
          <p className="mt-2 break-words text-lg font-semibold text-ink">
            {session.user.role ?? "PARTICIPANT"}
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-4">
        <MetricCard label="Meus boloes" value={allMemberships.length} />
        <MetricCard label="Criados por mim" value={createdPools} />
        <MetricCard label="Jogos sem palpite" value={pendingPredictions} />
        <MetricCard label="Rankings ativos" value={rankingPositions.length} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-ink">Meus boloes</h2>
            <Link className="text-sm font-semibold text-brand-700" href="/pools">
              Gerenciar
            </Link>
          </div>
          <div className="mt-4 divide-y divide-stone-100">
            {visibleMemberships.length > 0 ? (
              visibleMemberships.map((membership) => (
                <div
                  key={membership.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="font-semibold text-ink">{membership.pool.name}</p>
                    <p className="text-sm text-stone-600">
                      {membership.role} · {membership.pool._count.members} membros
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      className="rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700"
                      href={`/pools/${membership.pool.id}`}
                    >
                      Abrir
                    </Link>
                    <Link
                      className="rounded-md border border-brand-700 px-3 py-2 text-sm font-semibold text-brand-700"
                      href={`/pools/${membership.pool.id}/predictions`}
                    >
                      Palpites
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-4 text-sm text-stone-600">
                Voce ainda nao participa de nenhum bolao.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-ink">Minha posicao</h2>
          <div className="mt-4 space-y-3">
            {rankingPositions.length > 0 ? (
              rankingPositions.map((ranking) => (
                <Link
                  key={ranking.id}
                  href={`/pools/${ranking.pool.id}/rankings`}
                  className="block rounded-md border border-stone-200 p-3 hover:border-brand-500"
                >
                  <p className="font-semibold text-ink">{ranking.pool.name}</p>
                  <p className="mt-1 text-sm text-stone-600">
                    #{ranking.position} · {ranking.totalPoints} pontos
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-stone-600">
                Rankings aparecem aqui depois que houver resultados e pontuacao.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}
