import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AuthCard } from "@/components/layout/auth-card";

type RedefinirSenhaPageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function RedefinirSenhaPage({
  searchParams
}: RedefinirSenhaPageProps) {
  const params = await searchParams;

  return (
    <AuthCard
      title="Redefinir senha"
      description="Crie uma nova senha para recuperar o acesso a sua conta."
    >
      <ResetPasswordForm token={params.token ?? ""} />
    </AuthCard>
  );
}
