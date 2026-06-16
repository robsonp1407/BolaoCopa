"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { readJsonResponse } from "@/lib/http/client";

export function JoinPoolForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setIsSubmitting(true);
    setMessage(null);
    setIsError(false);

    const response = await fetch("/api/pools/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        joinCode: String(formData.get("joinCode") ?? ""),
        password: String(formData.get("password") ?? "") || undefined
      })
    });
    const payload = await readJsonResponse(response);

    if (!payload.ok) {
      setMessage(payload.message);
      setIsError(true);
      setIsSubmitting(false);
      return;
    }

    setMessage("Voce entrou no bolao.");
    setIsSubmitting(false);
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-brand-700">
          Entrar
        </p>
        <h2 className="mt-1 text-xl font-semibold text-ink">Codigo do bolao</h2>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="block text-sm font-medium text-stone-700">
          Codigo
          <input
            name="joinCode"
            required
            minLength={4}
            maxLength={12}
            disabled={isSubmitting}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 uppercase"
          />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          Senha, se houver
          <input
            name="password"
            type="password"
            disabled={isSubmitting}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-400"
        >
          Entrar
        </button>
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
  );
}
