import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bolao Copa 2026",
  description: "Fundacao inicial do sistema Bolao Copa 2026"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link className="font-semibold text-brand-700" href="/">
              Bolao Copa 2026
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link className="text-stone-700 hover:text-brand-700" href="/login">
                Login
              </Link>
              <Link className="text-stone-700 hover:text-brand-700" href="/cadastro">
                Cadastro
              </Link>
              <Link className="text-stone-700 hover:text-brand-700" href="/dashboard">
                Dashboard
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
