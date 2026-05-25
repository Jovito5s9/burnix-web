import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/ui/empty-state";

export default function ContractsPage() {
  return (
    <section className="py-8">
      <Container>
        <Card>
          <CardHeader>
            <CardTitle>Contratos</CardTitle>
            <CardDescription>
              Área base para listagem de contratos, inscrições e vínculos de pagamento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="Nenhum contrato carregado"
              description="Quando o backend estiver ligado, esta área exibirá a lista principal."
              action={
                <Button asChild>
                  <Link href="/dashboard">Voltar ao dashboard</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}
