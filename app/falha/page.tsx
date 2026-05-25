import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

export default function Page() {
  return (
    <section className="py-16">
      <Container className="max-w-xl">
        <Alert variant="destructive" title="Falha">
          Esta página serve como retorno de fluxo para checkout, webhook ou redirecionamento.
        </Alert>
        <div className="mt-4">
          <Button asChild>
            <Link href="/dashboard">Ir para o dashboard</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
