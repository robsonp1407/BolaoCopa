"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { readJsonResponse } from "@/lib/http/client";

type PoolMember = {
  id: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

type PoolManagementPanelProps = {
  pool: {
    id: string;
    name: string;
    description: string | null;
    isPrivate: boolean;
    maxParticipants: number | null;
  };
  members: PoolMember[];
  currentUserId: string;
  isMember: boolean;
  canManage: boolean;
  canDelete: boolean;
};

export function PoolManagementPanel({
  pool,
  members,
  currentUserId,
  isMember,
  canManage,
  canDelete
}: PoolManagementPanelProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrivate, setIsPrivate] = useState(pool.isPrivate);

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const maxParticipants = String(formData.get("maxParticipants") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    await runAction(
      fetch(`/api/pools/${pool.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(formData.get("name") ?? ""),
          description: String(formData.get("description") ?? "") || null,
          isPrivate,
          password: password || undefined,
          maxParticipants: maxParticipants ? Number(maxParticipants) : null
        })
      }),
      "Bolao atualizado."
    );
  }

  async function leavePool() {
    await runAction(
      fetch(`/api/pools/${pool.id}/leave`, { method: "POST" }),
      "Voce saiu do bolao.",
      "/pools"
    );
  }

  async function deletePool() {
    if (!window.confirm("Excluir este bolao? A acao faz soft delete.")) {
      return;
    }

    await runAction(
      fetch(`/api/pools/${pool.id}`, { method: "DELETE" }),
      "Bolao excluido.",
      "/pools"
    );
  }

  async function removeMember(userId: string) {
    if (!window.confirm("Remover este membro do bolao?")) {
      return;
    }

    await runAction(
      fetch(`/api/pools/${pool.id}/members/${userId}`, { method: "DELETE" }),
      "Membro removido."
    );
  }

  async function transferOwner(userId: string) {
    if (!window.confirm("Transferir a propriedade do bolao para este membro?")) {
      return;
    }

    await runAction(
      fetch(`/api/pools/${pool.id}/owner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      }),
      "Propriedade transferida."
    );
  }

  async function runAction(
    request: Promise<Response>,
    successMessage: string,
    redirectTo?: string
  ) {
    setIsSubmitting(true);
    setMessage(null);
    setIsError(false);

    const response = await request.catch(() => null);

    if (!response) {
      setMessage("Nao foi possivel conectar ao servidor.");
      setIsError(true);
      setIsSubmitting(false);
      return;
    }

    const payload = await readJsonResponse(response);

    if (!payload.ok) {
      setMessage(payload.message);
      setIsError(true);
      setIsSubmitting(false);
      return;
    }

    setMessage(successMessage);
    setIsSubmitting(false);

    if (redirectTo) {
      router.push(redirectTo);
      return;
    }

    router.refresh();
  }

  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
      <form
        onSubmit={handleUpdate}
        className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
      >
        <h2 className="text-xl font-semibold text-ink">Gerenciar bolao</h2>

        {!canManage ? (
          <p className="mt-3 rounded-md bg-stone-50 px-3 py-2 text-sm text-stone-600">
            Apenas ADMIN, OWNER ou ADMIN do bolao podem editar estes dados.
          </p>
        ) : null}

        <div className="mt-4 space-y-4">
          <label className="block text-sm font-medium text-stone-700">
            Nome
            <input
              name="name"
              required
              minLength={3}
              maxLength={100}
              defaultValue={pool.name}
              disabled={!canManage || isSubmitting}
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
            />
          </label>

          <label className="block text-sm font-medium text-stone-700">
            Descricao
            <textarea
              name="description"
              maxLength={500}
              defaultValue={pool.description ?? ""}
              disabled={!canManage || isSubmitting}
              className="mt-1 min-h-20 w-full rounded-md border border-stone-300 px-3 py-2"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-stone-700">
              Limite
              <input
                name="maxParticipants"
                type="number"
                min={2}
                max={10000}
                defaultValue={pool.maxParticipants ?? ""}
                disabled={!canManage || isSubmitting}
                className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
              />
            </label>
            <label className="flex items-center gap-2 pt-7 text-sm font-medium text-stone-700">
              <input
                type="checkbox"
                checked={isPrivate}
                disabled={!canManage || isSubmitting}
                onChange={(event) => setIsPrivate(event.target.checked)}
                className="h-4 w-4"
              />
              Privado
            </label>
          </div>

          {isPrivate ? (
            <label className="block text-sm font-medium text-stone-700">
              Nova senha privada
              <input
                name="password"
                type="password"
                minLength={4}
                maxLength={100}
                disabled={!canManage || isSubmitting}
                className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
              />
            </label>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={!canManage || isSubmitting}
            className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            Salvar alteracoes
          </button>
          {isMember ? (
            <button
              type="button"
              onClick={leavePool}
              disabled={isSubmitting}
              className="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 disabled:cursor-not-allowed disabled:text-stone-400"
            >
              Sair do bolao
            </button>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              onClick={deletePool}
              disabled={isSubmitting}
              className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:text-stone-400"
            >
              Excluir bolao
            </button>
          ) : null}
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
      </form>

      <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-ink">Acoes de membros</h2>
        <div className="mt-4 divide-y divide-stone-100">
          {members.map((member) => {
            const isCurrentUser = member.userId === currentUserId;

            return (
              <div
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-semibold text-ink">
                    {member.user.name ?? member.user.email}
                  </p>
                  <p className="text-sm text-stone-600">
                    {member.role}
                    {isCurrentUser ? " · voce" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canDelete && !isCurrentUser ? (
                    <button
                      type="button"
                      onClick={() => transferOwner(member.userId)}
                      disabled={isSubmitting}
                      className="rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 disabled:cursor-not-allowed disabled:text-stone-400"
                    >
                      Tornar dono
                    </button>
                  ) : null}
                  {canManage && !isCurrentUser && member.role !== "OWNER" ? (
                    <button
                      type="button"
                      onClick={() => removeMember(member.userId)}
                      disabled={isSubmitting}
                      className="rounded-md border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:text-stone-400"
                    >
                      Remover
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
