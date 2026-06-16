import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CreatePoolForm } from "@/components/pools/create-pool-form";
import { JoinPoolForm } from "@/components/pools/join-pool-form";
import { prisma } from "@/lib/db/prisma";
import { canCreatePool } from "@/services/pools/permissions";

export default async function PoolsPage() {
  const session = await auth();

  if (!session?.user.id) {
    redirect("/login");
  }

  const pools = await prisma.pool.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { isPrivate: false },
        { members: { some: { userId: session.user.id } } }
      ]
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        where: { userId: session.user.id },
        select: { role: true }
      },
      _count: { select: { members: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="border-b border-stone-200 pb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-700">
          Boloes
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ink">
          Participar, criar e jogar
        </h1>
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <JoinPoolForm />
        <CreatePoolForm canCreate={canCreatePool(session.user.role)} />
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-ink">Boloes disponiveis</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {pools.map((pool) => {
            const membership = pool.members[0];

            return (
              <article
                key={pool.id}
                className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-ink">{pool.name}</p>
                    <p className="mt-1 text-sm text-stone-600">
                      Dono: {pool.owner.name ?? pool.owner.email}
                    </p>
                  </div>
                  <span className="rounded-md bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-700">
                    {pool.isPrivate ? "Privado" : "Publico"}
                  </span>
                </div>
                {pool.description ? (
                  <p className="mt-3 text-sm text-stone-600">{pool.description}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-stone-600">
                    {pool._count.members} membros
                    {membership ? ` · ${membership.role}` : ""}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      className="rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700"
                      href={`/pools/${pool.id}`}
                    >
                      Detalhes
                    </Link>
                    {membership ? (
                      <Link
                        className="rounded-md bg-brand-700 px-3 py-2 text-sm font-semibold text-white"
                        href={`/pools/${pool.id}/predictions`}
                      >
                        Palpites
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
