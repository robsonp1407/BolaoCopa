import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { MatchResultForm } from "@/components/admin/match-result-form";
import { RecalculateTournamentButton } from "@/components/admin/recalculate-tournament-button";
import { RetroactivePredictionForm } from "@/components/admin/retroactive-prediction-form";
import { prisma } from "@/lib/db/prisma";
import { canManageOfficialResults } from "@/services/tournament/admin-auth";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user.id) {
    redirect("/login");
  }

  if (!canManageOfficialResults(session.user.role)) {
    redirect("/dashboard");
  }

  const [matches, pools, users, auditLogs] = await Promise.all([
    prisma.match.findMany({
      include: {
        stage: { select: { name: true } },
        group: { select: { code: true } },
        homeTeam: { select: { name: true, flagEmoji: true } },
        awayTeam: { select: { name: true, flagEmoji: true } }
      },
      orderBy: { matchNumber: "asc" }
    }),
    prisma.pool.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    }),
    prisma.user.findMany({
      orderBy: [{ name: "asc" }, { email: "asc" }],
      select: { id: true, name: true, email: true }
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: { select: { name: true, email: true } }
      }
    })
  ]);

  const matchOptions = matches.map((match) => ({
    id: match.id,
    label: [
      `Jogo ${match.matchNumber}`,
      match.stage.name,
      match.group ? `Grupo ${match.group.code}` : null,
      `${formatTeam(match.homeTeam, match.homeSlot)} x ${formatTeam(
        match.awayTeam,
        match.awaySlot
      )}`
    ]
      .filter(Boolean)
      .join(" · "),
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    homePenaltyScore: match.homePenaltyScore,
    awayPenaltyScore: match.awayPenaltyScore
  }));
  const retroactiveMatchOptions = matches.map((match) => ({
    id: match.id,
    label: [
      `Jogo ${match.matchNumber}`,
      match.status,
      match.stage.name,
      `${formatTeam(match.homeTeam, match.homeSlot)} x ${formatTeam(
        match.awayTeam,
        match.awaySlot
      )}`
    ]
      .filter(Boolean)
      .join(" · ")
  }));
  const userOptions = users.map((user) => ({
    id: user.id,
    label: [user.name, user.email].filter(Boolean).join(" · ")
  }));

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="border-b border-stone-200 pb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-700">
          Administracao
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ink">
          Operacoes oficiais da Copa
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          Area restrita a ADMIN para registrar resultados e reprocessar dados
          derivados.
        </p>
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <MatchResultForm matches={matchOptions} />
        <RecalculateTournamentButton />
      </section>

      <section className="mt-8">
        <RetroactivePredictionForm
          pools={pools}
          users={userOptions}
          matches={retroactiveMatchOptions}
        />
      </section>

      <section className="mt-8 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-ink">Auditoria recente</h2>
        <div className="mt-4 divide-y divide-stone-100">
          {auditLogs.map((log) => (
            <div key={log.id} className="py-3">
              <p className="font-semibold text-ink">{log.action}</p>
              <p className="mt-1 text-sm text-stone-600">
                {log.entity}
                {log.entityId ? ` · ${log.entityId}` : ""} ·{" "}
                {log.user?.name ?? log.user?.email ?? "sistema"} ·{" "}
                {new Intl.DateTimeFormat("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short"
                }).format(log.createdAt)}
              </p>
            </div>
          ))}
          {auditLogs.length === 0 ? (
            <p className="py-4 text-sm text-stone-600">
              Nenhum evento administrativo registrado ainda.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
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
