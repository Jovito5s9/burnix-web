"use client";

import { useEffect } from "react";

import { Container } from "@/components/layout/container";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="py-16">
      <Container className="max-w-3xl">
        <Alert variant="destructive" title="Não foi possível carregar suas inscrições">
          <div className="space-y-3">
            <p>Ocorreu uma falha inesperada. Tente carregar esta área novamente.</p>
            <Button variant="secondary" onClick={reset}>
              Tentar novamente
            </Button>
          </div>
        </Alert>
      </Container>
    </section>
  );
}
