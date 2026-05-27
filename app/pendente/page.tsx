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
  const checkoutId = getValue(searchParams?.checkout_id);

  return (
    <section className="py-16">
      <Container className="max-w-2xl">
        <Alert variant="warning" title="Pagamento pendente">
          <div className="space-y-2">
            <p>O checkout ainda não foi confirmado. O pagamento pode ser consultado novamente em instantes.</p>
            {paymentId || checkoutId ? (
              <p className="text-sm text-amber-900/80">
                {paymentId ? `Pagamento: ${paymentId}. ` : ""}
                {checkoutId ? `Checkout: ${checkoutId}.` : ""}
              </p>
            ) : null}
          </div>
        </Alert>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/payments">Consultar pagamentos</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/dashboard">Ir para o dashboard</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
