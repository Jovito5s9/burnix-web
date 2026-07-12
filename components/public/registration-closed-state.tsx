import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  getRegistrationClosedMessage,
  getRegistrationClosedTitle,
} from "@/lib/event-availability";
import type { RegistrationAvailabilityState } from "@/types/public-contract";

type RegistrationClosedStateProps = {
  reason: Exclude<RegistrationAvailabilityState, "open">;
  message?: string | null;
};

export function RegistrationClosedState({
  reason,
  message,
}: RegistrationClosedStateProps) {
  const variant = reason === "event_cancelled" ? "destructive" : "warning";

  return (
    <div className="space-y-4" data-testid="registration-closed-state">
      <Alert variant={variant} title={getRegistrationClosedTitle(reason)}>
        <p>{getRegistrationClosedMessage(reason, message)}</p>
      </Alert>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p>
          Quem já realizou a inscrição continua podendo consultar seus dados e o
          pagamento existente.
        </p>
        <Button asChild className="mt-4 w-full" variant="secondary">
          <Link href="/minhas-inscricoes">Acessar Minhas inscrições</Link>
        </Button>
      </div>
    </div>
  );
}
