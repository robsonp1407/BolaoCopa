import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/auth";
import { PredictionsForm } from "@/components/predictions/predictions-form";

type PredictionsPageProps = {
  params: Promise<{ poolId: string }>;
};

export default async function PredictionsPage({ params }: PredictionsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { poolId } = await params;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Link
        className="mb-4 inline-flex rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700"
        href={`/pools/${poolId}`}
      >
        Voltar ao bolao
      </Link>
      <PredictionsForm poolId={poolId} />
    </main>
  );
}
