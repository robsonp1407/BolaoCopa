import Link from "next/link";

import { auth } from "@/auth";
import { LogoutButton } from "@/components/auth/logout-button";
import { getPrimaryNavigation } from "@/lib/ui/navigation";

export async function SiteHeader() {
  const session = await auth();
  const items = getPrimaryNavigation({
    isAuthenticated: Boolean(session?.user),
    role: session?.user.role
  });

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link className="font-semibold text-brand-700" href="/">
          Bolao Copa 2026
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-4 text-sm">
          {items.map((item) => (
            <Link
              key={item.href}
              className="text-stone-700 hover:text-brand-700"
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
          {session?.user ? <LogoutButton /> : null}
        </nav>
      </div>
    </header>
  );
}
