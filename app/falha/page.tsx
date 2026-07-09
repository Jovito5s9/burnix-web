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
  const message = getValue(searchParams?.message);

  return (
    <section className="py-16">
      <Container className="max-w-2xl">
        <Alert variant="destructive" title="Checkout não concluído">
          <div className="space-y-2">
            <p>O fluxo retornou com falha e a tentativa pode ser revisada no painel.</p>
            {paymentId || message ? (
              <p className="text-sm text-red-900/80">
                {paymentId ? `Pagamento: ${paymentId}. ` : ""}
                {message ? `Motivo: ${message}.` : ""}
              </p>
            ) : null}
          </div>
        </Alert>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/contracts">Revisar eventos</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/dashboard">Ir para o dashboard</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
