"use client";

import { useState } from "react";

export function RequestPasswordResetForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [developmentLink, setDevelopmentLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setDevelopmentLink(null);
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/password-reset/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: String(formData.get("email") ?? "") })
    });
    const data = (await response.json().catch(() => null)) as {
      message?: string;
      developmentLink?: string;
      error?: string;
    } | null;

    setIsSubmitting(false);

    if (!response.ok) {
      setError(data?.error ?? "Nao foi possivel solicitar a redefinicao.");
      return;
    }

    setMessage(data?.message ?? "Verifique as instrucoes para redefinir sua senha.");
    setDevelopmentLink(data?.developmentLink ?? null);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-stone-700">
        E-mail
        <input
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-brand-700">{message}</p> : null}
      {developmentLink ? (
        <a className="block break-words text-sm text-brand-700 underline" href={developmentLink}>
          Link de desenvolvimento
        </a>
      ) : null}
      <button
        className="w-full rounded-md bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Enviando..." : "Solicitar redefinicao"}
      </button>
    </form>
  );
}
