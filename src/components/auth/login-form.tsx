"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirect: false,
      callbackUrl
    });

    setIsSubmitting(false);

    if (result?.error) {
      setError("E-mail ou senha invalidos.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="space-y-5">
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
        <label className="block text-sm font-medium text-stone-700">
          Senha
          <input
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          className="w-full rounded-md bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <button
        className="w-full rounded-md border border-stone-300 px-4 py-2 font-semibold text-stone-800 hover:border-brand-600 hover:text-brand-700"
        onClick={() => signIn("google", { callbackUrl })}
        type="button"
      >
        Entrar com Google
      </button>
      <div className="flex justify-between text-sm">
        <Link className="text-brand-700 hover:underline" href="/esqueci-minha-senha">
          Esqueci minha senha
        </Link>
        <Link className="text-brand-700 hover:underline" href="/cadastro">
          Criar conta
        </Link>
      </div>
    </div>
  );
}
