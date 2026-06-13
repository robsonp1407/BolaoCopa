import { RegisterForm } from "@/components/auth/register-form";
import { AuthCard } from "@/components/layout/auth-card";

export default function CadastroPage() {
  return (
    <AuthCard
      title="Criar conta"
      description="Cadastre-se para acessar o dashboard inicial do bolao."
    >
      <RegisterForm />
    </AuthCard>
  );
}
