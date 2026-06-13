import { Suspense } from "react";

import { AuthCard } from "@/components/layout/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthCard
      title="Entrar"
      description="Acesse sua conta com e-mail e senha ou com Google."
    >
      <Suspense fallback={<p className="text-sm text-stone-600">Carregando...</p>}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
