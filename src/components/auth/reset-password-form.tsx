"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/password-reset/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        password: String(formData.get("password") ?? "")
      })
    });
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    setIsSubmitting(false);

    if (!response.ok) {
      setError(data?.error ?? "Nao foi possivel redefinir a senha.");
      return;
    }

    setIsDone(true);
    router.refresh();
  }

  if (!token) {
    return (
      <p className="text-sm text-red-700">
        Token ausente. Solicite uma nova redefinicao de senha.
      </p>
    );
  }

  if (isDone) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-brand-700">Senha redefinida com sucesso.</p>
        <Link
          className="block rounded-md bg-brand-600 px-4 py-2 text-center font-semibold text-white hover:bg-brand-700"
          href="/login"
        >
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-stone-700">
        Nova senha
        <input
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        className="w-full rounded-md bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Redefinindo..." : "Redefinir senha"}
      </button>
    </form>
  );
}
