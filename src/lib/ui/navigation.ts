import type { Role } from "@prisma/client";

export type NavigationItem = {
  label: string;
  href: string;
};

export function getPrimaryNavigation(input: {
  isAuthenticated: boolean;
  role?: Role;
}): NavigationItem[] {
  if (!input.isAuthenticated) {
    return [
      { label: "Login", href: "/login" },
      { label: "Cadastro", href: "/cadastro" }
    ];
  }

  const items: NavigationItem[] = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Boloes", href: "/pools" }
  ];

  if (input.role === "ADMIN") {
    items.push({ label: "Admin", href: "/admin" });
  }

  return items;
}
