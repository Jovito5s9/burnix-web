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
    title: "Inscrições públicas",
    description: "Compartilhe a página do evento, receba inscrições e ofereça pagamento por Pix quando necessário.",
  },
  {
    title: "Formulários dinâmicos",
    description: "Personalize o formulário de cada evento para coletar as informações necessárias dos participantes.",
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
            Organize seus eventos em um só lugar, acompanhe as inscrições e tenha uma visão clara dos pagamentos.
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
                  Tudo o que você precisa para publicar eventos, receber participantes e acompanhar pagamentos por Pix.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
