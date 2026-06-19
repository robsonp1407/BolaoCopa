import type { Metadata } from "next";

import { SiteHeader } from "@/components/layout/site-header";

import "./globals.css";

export const metadata: Metadata = {
  title: "Bolao Copa 2026",
  description: "Fundacao inicial do sistema Bolao Copa 2026"
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
