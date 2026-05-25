import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/layout/container";

export default function Page() {
  return (
    <section className="py-16">
      <Container className="max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Criar conta</CardTitle>
            <CardDescription>Inicie o cadastro da operação e prepare o fluxo de inscrições.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="info" title="Base visual provisória">
              Esta rota já existe para validação de layout e navegação. Os campos
              de autenticação podem ser ligados depois ao backend.
            </Alert>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/dashboard">Criar acesso</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/">Voltar</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}
