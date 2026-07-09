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
  const message = getValue(searchParams?.message);

  return (
    <section className="py-16">
      <Container className="max-w-2xl">
        <Alert variant="destructive" title="Pagamento Pix não concluído">
          <div className="space-y-2">
            <p>
              Esta página é um retorno externo legado. Ela não substitui o status real salvo pelo backend
              depois do webhook OpenPix.
            </p>
            <p>
              Revise a cobrança em <strong>Pagamentos</strong> ou no detalhe do evento para confirmar o
              status atualizado.
            </p>
            {paymentId || contractId || message ? (
              <p className="text-sm text-red-900/80">
                {paymentId ? `Pagamento: ${paymentId}. ` : ""}
                {contractId ? `Evento: ${contractId}. ` : ""}
                {message ? `Motivo recebido: ${message}.` : ""}
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
            <Link href="/contracts">Revisar eventos</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
