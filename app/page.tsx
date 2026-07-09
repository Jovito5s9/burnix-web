import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";

const highlights = [
  {
    title: "Eventos organizados",
    description: "Crie eventos, acompanhe capacidade, datas, prazo de inscrição e status de publicação.",
  },
  {
    title: "Inscrições e participantes",
    description: "Use a estrutura atual do backend para conectar eventos, inscrições e pagamentos em um único fluxo.",
  },
  {
    title: "Pagamentos preparados",
    description: "Acompanhe cobranças vinculadas ao evento e mantenha compatibilidade com as rotas atuais do backend.",
  },
];

export default function HomePage() {
  return (
    <section className="py-16">
      <Container>
        <div className="max-w-3xl space-y-6">
          <Badge>Burnix Web</Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Gestão de eventos, inscrições e pagamentos
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Crie eventos, gerencie inscrições e acompanhe pagamentos com uma interface alinhada ao backend atual do Burnix.
            A API ainda usa rotas de contratos, como `/contracts/`, mas o produto agora trata esses registros como eventos.
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
                  Estrutura ideal para organizadores que precisam operar eventos e evoluir o fluxo público de inscrição.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
