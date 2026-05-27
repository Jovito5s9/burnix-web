import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function Page({ searchParams }: PageProps) {
  const paymentId = getValue(searchParams?.payment_id);
  const contractId = getValue(searchParams?.contract_id);
  const checkoutId = getValue(searchParams?.checkout_id);

  return (
    <section className="py-16">
      <Container className="max-w-2xl">
        <Alert variant="success" title="Pagamento aprovado">
          <div className="space-y-2">
            <p>O checkout retornou com sucesso e o fluxo pode ser consultado no painel.</p>
            {paymentId || contractId || checkoutId ? (
              <p className="text-sm text-green-900/80">
                {paymentId ? `Pagamento: ${paymentId}. ` : ""}
                {contractId ? `Contrato: ${contractId}. ` : ""}
                {checkoutId ? `Checkout: ${checkoutId}.` : ""}
              </p>
            ) : null}
          </div>
        </Alert>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/payments">Ver pagamentos</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/dashboard">Ir para o dashboard</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
