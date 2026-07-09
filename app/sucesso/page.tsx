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
        <Alert variant="success" title="Retorno de pagamento Pix recebido">
          <div className="space-y-2">
            <p>
              Esta página existe apenas para compatibilidade com retornos externos. O pagamento Pix/OpenPix
              só deve ser considerado confirmado depois que o backend processar o webhook da OpenPix.
            </p>
            <p>
              Consulte a confirmação real em <strong>Pagamentos</strong> ou no detalhe do evento.
            </p>
            {paymentId || contractId || checkoutId || correlationId ? (
              <p className="text-sm text-green-900/80">
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
            <Link href="/payments">Ver pagamentos</Link>
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
