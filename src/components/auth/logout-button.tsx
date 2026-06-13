"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      className="rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700"
      onClick={() => signOut({ callbackUrl: "/" })}
      type="button"
    >
      Sair
    </button>
  );
}
