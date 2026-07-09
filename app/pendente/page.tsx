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
  const correlationId = getValue(searchParams?.correlation_id);

  return (
    <section className="py-16">
      <Container className="max-w-2xl">
        <Alert variant="warning" title="Pagamento Pix pendente">
          <div className="space-y-2">
            <p>
              O retorno externo indicou pendência, mas a confirmação definitiva depende do webhook OpenPix
              recebido e processado pelo backend.
            </p>
            <p>
              Reconsulte o pagamento em alguns instantes por <strong>GET /payments/</strong>,
              <strong> GET /payments/{"{payment_id}"}</strong> ou pelo detalhe do evento.
            </p>
            {paymentId || contractId || checkoutId || correlationId ? (
              <p className="text-sm text-amber-900/80">
                {paymentId ? `Pagamento: ${paymentId}. ` : ""}
                {contractId ? `Evento: ${contractId}. ` : ""}
                {checkoutId ? `Referência legada: ${checkoutId}. ` : ""}
                {correlationId ? `Correlação OpenPix: ${correlationId}.` : ""}
              </p>
            ) : null}
          </div>
        </Alert>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/payments">Consultar pagamentos</Link>
          </Button>
          {contractId ? (
            <Button variant="secondary" asChild>
              <Link href={`/contracts/${contractId}`}>Abrir evento</Link>
            </Button>
          ) : null}
          <Button variant="secondary" asChild>
            <Link href="/dashboard">Ir para o dashboard</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
