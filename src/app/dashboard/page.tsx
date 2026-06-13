import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-brand-700">
            Dashboard protegido
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ink">Minha conta</h1>
        </div>
        <LogoutButton />
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
    </main>
  );
}
