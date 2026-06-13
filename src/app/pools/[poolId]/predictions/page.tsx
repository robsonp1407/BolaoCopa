import { redirect } from "next/navigation";

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
      <PredictionsForm poolId={poolId} />
    </main>
  );
}
