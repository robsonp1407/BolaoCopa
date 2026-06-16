"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { readJsonResponse } from "@/lib/http/client";

type FormState = {
  message: string | null;
  isError: boolean;
};

export function CreatePoolForm({ canCreate }: { canCreate: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<FormState>({ message: null, isError: false });
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canCreate) {
      setState({
        message: "Apenas ADMIN ou ORGANIZER podem criar boloes.",
        isError: true
      });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const maxParticipantsValue = String(formData.get("maxParticipants") ?? "").trim();

    setIsSubmitting(true);
    setState({ message: null, isError: false });

    const response = await fetch("/api/pools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? ""),
        isPrivate,
        password: String(formData.get("password") ?? "") || undefined,
        maxParticipants: maxParticipantsValue
          ? Number(maxParticipantsValue)
          : undefined
      })
    });
    const payload = await readJsonResponse(response);

    if (!payload.ok) {
      setState({
        message: payload.message,
        isError: true
      });
      setIsSubmitting(false);
      return;
    }

    setState({ message: "Bolao criado com sucesso.", isError: false });
    event.currentTarget.reset();
    setIsPrivate(false);
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
    >
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-brand-700">
          Criar bolao
        </p>
        <h2 className="mt-1 text-xl font-semibold text-ink">Novo bolao</h2>
      </div>

      {!canCreate ? (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Seu papel atual permite participar e palpitar, mas nao criar boloes.
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
            disabled={!canCreate || isSubmitting}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </label>

        <label className="block text-sm font-medium text-stone-700">
          Descricao
          <textarea
            name="description"
            maxLength={500}
            disabled={!canCreate || isSubmitting}
            className="mt-1 min-h-20 w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-stone-700">
            Limite de participantes
            <input
              name="maxParticipants"
              type="number"
              min={2}
              max={10000}
              disabled={!canCreate || isSubmitting}
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
            />
          </label>

          <label className="flex items-center gap-2 pt-7 text-sm font-medium text-stone-700">
            <input
              type="checkbox"
              checked={isPrivate}
              disabled={!canCreate || isSubmitting}
              onChange={(event) => setIsPrivate(event.target.checked)}
              className="h-4 w-4"
            />
            Privado
          </label>
        </div>

        {isPrivate ? (
          <label className="block text-sm font-medium text-stone-700">
            Senha do bolao privado
            <input
              name="password"
              type="password"
              minLength={4}
              maxLength={100}
              required={isPrivate}
              disabled={!canCreate || isSubmitting}
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
            />
          </label>
        ) : null}
      </div>

      {state.message ? (
        <p
          className={`mt-4 rounded-md px-3 py-2 text-sm ${
            state.isError ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canCreate || isSubmitting}
        className="mt-5 rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-400"
      >
        Criar bolao
      </button>
    </form>
  );
}
