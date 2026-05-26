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
    <div className="py-16">
      <Container className="max-w-3xl">
        <Alert variant="destructive" title="Algo deu errado">
          <div className="space-y-3">
            <p>{error.message || "Falha inesperada ao carregar esta área."}</p>
            <Button variant="secondary" onClick={reset}>
              Tentar novamente
            </Button>
          </div>
        </Alert>
      </Container>
    </div>
  );
}
