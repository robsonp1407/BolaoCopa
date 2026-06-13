import { RequestPasswordResetForm } from "@/components/auth/request-password-reset-form";
import { AuthCard } from "@/components/layout/auth-card";

export default function EsqueciMinhaSenhaPage() {
  return (
    <AuthCard
      title="Esqueci minha senha"
      description="Informe seu e-mail para gerar um link de redefinicao."
    >
      <RequestPasswordResetForm />
    </AuthCard>
  );
}
