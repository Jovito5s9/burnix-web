import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";

const highlights = [
  {
    title: "Inscrições organizadas",
    description: "Base pensada para fluxo de cadastro, confirmação e acompanhamento.",
  },
  {
    title: "Pagamentos preparados",
    description: "Estrutura pronta para checkout, status de pagamento e páginas de retorno.",
  },
  {
    title: "Escala sem retrabalho",
    description: "Separação clara entre UI, serviços, hooks e tipagem compartilhada.",
  },
];

export default function HomePage() {
  return (
    <section className="py-16">
      <Container>
        <div className="max-w-3xl space-y-6">
          <Badge>Burnix Web</Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Base inicial para o SaaS de inscrições e pagamentos.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Um frontend com casca estável, componentes reutilizáveis e organização pronta
            para autenticação, contratos, cobranças e painel administrativo.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/login">Entrar</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/register">Criar conta</Link>
            </Button>
          </div>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Estrutura simples agora, pronta para ganhar complexidade depois.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
