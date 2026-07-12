import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getRegistrationHref(value: string | string[] | undefined) {
  const registrationId = Array.isArray(value) ? value[0] : value;
  return registrationId && /^\d+$/.test(registrationId)
    ? `/minhas-inscricoes/${registrationId}`
    : null;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const registrationHref = getRegistrationHref(params.registration_id);

  return (
    <section className="py-16">
      <Container className="max-w-2xl">
        <Alert variant="success" title="Pagamento enviado">
          <p>
            Estamos aguardando a confirmação do pagamento. A situação da sua inscrição será atualizada automaticamente.
          </p>
        </Alert>

        <div className="mt-6 flex flex-wrap gap-3">
          {registrationHref ? (
            <Button asChild>
              <Link href={registrationHref}>Ver minha inscrição</Link>
            </Button>
          ) : null}
          <Button variant={registrationHref ? "secondary" : "primary"} asChild>
            <Link href="/minhas-inscricoes">Minhas inscrições</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
