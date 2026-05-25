import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/layout/container";

export default function PaymentsPage() {
  return (
    <section className="py-8">
      <Container>
        <Card>
          <CardHeader>
            <CardTitle>Pagamentos</CardTitle>
            <CardDescription>
              Base para status, histórico, cobranças e integrações de checkout.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Página de apoio pronta para futuras mutações e filtros com React Query.
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}
