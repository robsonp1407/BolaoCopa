import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-5xl content-center px-4 py-16">
      <section className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-700">
          Fase 1
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-normal text-ink sm:text-5xl">
          Fundacao do Bolao Copa 2026
        </h1>
        <p className="mt-5 text-lg leading-8 text-stone-700">
          Base inicial com autenticacao, cadastro, recuperacao de senha,
          papeis de usuario e dashboard protegido.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="rounded-md bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            href="/cadastro"
          >
            Criar conta
          </Link>
          <Link
            className="rounded-md border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-800 hover:border-brand-600 hover:text-brand-700"
            href="/login"
          >
            Entrar
          </Link>
        </div>
      </section>
    </main>
  );
}
