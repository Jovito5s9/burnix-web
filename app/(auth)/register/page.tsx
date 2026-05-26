import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/components/forms/register-form";

export default function RegisterPage() {
  return (
    <section className="py-16">
      <Container className="max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Criar conta</CardTitle>
            <CardDescription>
              Cadastre-se para começar a gerenciar inscrições e pagamentos.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <RegisterForm />

            <div className="text-center text-sm text-zinc-500">
              Já possui conta? {" "}
              <Link className="font-medium text-zinc-900 hover:underline" href="/login">
                Entrar
              </Link>
            </div>
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}
