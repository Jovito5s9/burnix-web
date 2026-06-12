import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";

const highlights = [
  {
    title: "Inscrições organizadas",
    description: "Gerencie eventos, inscrições e participantes com facilidade usando uma estrutura clara e intuitiva.",
  },
  {
    title: "Pagamentos preparados",
    description: "Fluxo de checkout e retorno por status para gerenciar pagamentos de forma eficiente.",
  },
  {
    title: "Escala sem retrabalho",
    description: "Estrutura escalável que permite adicionar novas funcionalidades sem precisar reescrever o código existente.",
  },
];

export default function HomePage() {
  return (
    <section className="py-16">
      <Container>
        <div className="max-w-3xl space-y-6">
          <Badge>Burnix Web</Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Estrutura de inscrições e pagamentos para eventos
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Crie eventos, gerencie inscrições e acompanhe pagamentos com esta estrutura pronta para ser personalizada.
            Inclui autenticação, gerenciamento de contratos, fluxo de checkout e painel administrativo básico
          </p>

          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" asChild>
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
                  Esta estrutura é ideal para organizadores de eventos que precisam de uma solução rápida e personalizável.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
