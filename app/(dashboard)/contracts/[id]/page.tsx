import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/layout/container";

type ContractDetailsPageProps = {
  params: {
    id: string;
  };
};

export default function ContractDetailsPage({ params }: ContractDetailsPageProps) {
  return (
    <section className="py-8">
      <Container>
        <Card>
          <CardHeader>
            <CardTitle>Detalhe do contrato</CardTitle>
            <CardDescription>Rota pronta para visualizar uma inscrição específica.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>ID: <span className="font-medium text-slate-950">{params.id}</span></p>
            <p>Estrutura inicial criada apenas para modelagem e validação de layout.</p>
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}
