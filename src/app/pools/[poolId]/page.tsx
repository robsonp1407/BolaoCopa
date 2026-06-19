import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { PoolManagementPanel } from "@/components/pools/pool-management-panel";
import { prisma } from "@/lib/db/prisma";
import { getPoolDetails } from "@/services/pools/get-pools";
import { canDeletePool, canManagePool } from "@/services/pools/permissions";

export const dynamic = "force-dynamic";

type PoolDetailsPageProps = {
  params: Promise<{ poolId: string }>;
};

export default async function PoolDetailsPage({ params }: PoolDetailsPageProps) {
  const session = await auth();

  if (!session?.user.id) {
    redirect("/login");
  }

  const { poolId } = await params;
  const pool = await getPoolDetails(prisma, {
    poolId,
    userId: session.user.id
  }).then(async (visiblePool) => {
    if (visiblePool || session.user.role !== "ADMIN") {
      return visiblePool;
    }

    return prisma.pool.findFirst({
      where: { id: poolId, status: "ACTIVE" },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { joinedAt: "asc" }
        },
        scoreRule: true
      }
    });
  });

  if (!pool) {
    notFound();
  }

  const membership = pool.members.find((member) => member.userId === session.user.id);
  const canManageCurrentPool = canManagePool(session.user.role, membership?.role);
  const canDeleteCurrentPool = canDeletePool(session.user.role, membership?.role);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-brand-700">
            Detalhes do bolao
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ink">{pool.name}</h1>
          {pool.description ? (
            <p className="mt-2 max-w-2xl text-stone-600">{pool.description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {membership ? (
            <>
              <Link
                className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
                href={`/pools/${pool.id}/predictions`}
              >
                Palpites
              </Link>
              <Link
                className="rounded-md border border-brand-700 px-4 py-2 text-sm font-semibold text-brand-700"
                href={`/pools/${pool.id}/rankings`}
              >
                Ranking
              </Link>
            </>
          ) : (
            <Link
              className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
              href="/pools"
            >
              Entrar pelo codigo
            </Link>
          )}
        </div>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        <InfoCard label="Visibilidade" value={pool.isPrivate ? "Privado" : "Publico"} />
        <InfoCard label="Membros" value={String(pool.members.length)} />
        <InfoCard label="Meu papel" value={membership?.role ?? "Nao membro"} />
        <InfoCard label="Dono" value={pool.owner.name ?? pool.owner.email} />
      </section>

      {membership ? (
        <section className="mt-6 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-ink">Convite</h2>
          <p className="mt-2 text-sm text-stone-600">
            Compartilhe este codigo com quem deve participar do bolao.
          </p>
          <input
            readOnly
            value={pool.joinCode}
            className="mt-4 w-full rounded-md border border-stone-300 bg-stone-50 px-3 py-2 font-mono text-lg font-semibold tracking-wide"
          />
        </section>
      ) : null}

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-ink">Membros</h2>
          <div className="mt-4 divide-y divide-stone-100">
            {pool.members.map((member) => (
              <div
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-semibold text-ink">
                    {member.user.name ?? member.user.email}
                  </p>
                  <p className="text-sm text-stone-600">{member.user.email}</p>
                </div>
                <span className="rounded-md bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-700">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-ink">Regra de pontuacao</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <RuleRow label="Resultado correto" value={pool.scoreRule?.winnerPoints ?? 3} />
            <RuleRow label="Placar exato" value={pool.scoreRule?.exactScorePoints ?? 2} />
            <RuleRow
              label="Vencedor no mata-mata"
              value={pool.scoreRule?.knockoutWinnerPoints ?? 1}
            />
            <RuleRow
              label="Placar de um time"
              value={pool.scoreRule?.singleTeamScorePoints ?? 1}
            />
          </dl>
        </div>
      </section>

      {canManageCurrentPool || canDeleteCurrentPool ? (
        <PoolManagementPanel
          pool={{
            id: pool.id,
            name: pool.name,
            description: pool.description,
            isPrivate: pool.isPrivate,
            maxParticipants: pool.maxParticipants
          }}
          members={pool.members}
          currentUserId={session.user.id}
          isMember={Boolean(membership)}
          canManage={canManageCurrentPool}
          canDelete={canDeleteCurrentPool}
        />
      ) : null}
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-stone-500">{label}</p>
      <p className="mt-1 break-words text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}

function RuleRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-stone-50 px-3 py-2">
      <dt className="text-stone-600">{label}</dt>
      <dd className="font-semibold text-ink">{value} pts</dd>
    </div>
  );
}
