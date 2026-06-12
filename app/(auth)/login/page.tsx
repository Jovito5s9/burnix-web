import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  return (
    <section className="py-16"> 
      <Container className="max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>
              Faça login para ter acesso ao painel administrativo.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <LoginForm />

            <div className="text-center text-sm text-zinc-500">
              Ainda não possui conta? {" "}
              <Link className="font-medium text-zinc-900 hover:underline" href="/register">
                Criar conta
              </Link>
            </div>
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}
