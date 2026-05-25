import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  return (
    <section className="py-8">
      <Container>
        <div className="mb-6">
          <Badge>Dashboard</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            Visão geral
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Página inicial do painel para acompanhar inscrições, cobranças e status gerais.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Inscrições ativas</CardDescription>
              <CardTitle>0</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Métrica provisória para validar o layout.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Pagamentos confirmados</CardDescription>
              <CardTitle>0</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Espelho visual para futuro consumo de API.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Contratos em andamento</CardDescription>
              <CardTitle>0</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Estrutura pronta para listagem e detalhamento.
            </CardContent>
          </Card>
        </div>
      </Container>
    </section>
  );
}
