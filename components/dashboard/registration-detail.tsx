import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { Registration } from "@/types/registration";

type RegistrationDetailProps = {
  registration: Registration;
};

function formatExtraValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

export function RegistrationDetail({ registration }: RegistrationDetailProps) {
  const extraEntries = Object.entries(registration.extra_fields ?? {});

  return (
    <div className="space-y-4">
      <div className="grid gap-3 text-sm md:grid-cols-2">
        <div>
          <p className="text-slate-500">Nome</p>
          <p className="font-medium text-slate-950">{registration.name}</p>
        </div>
        <div>
          <p className="text-slate-500">E-mail</p>
          <p className="font-medium text-slate-950">{registration.email ?? "—"}</p>
        </div>
        <div>
          <p className="text-slate-500">Telefone</p>
          <p className="font-medium text-slate-950">{registration.phone ?? "—"}</p>
        </div>
        <div>
          <p className="text-slate-500">Documento</p>
          <p className="font-medium text-slate-950">{registration.document ?? "—"}</p>
        </div>
        <div>
          <p className="text-slate-500">Sexo</p>
          <p className="font-medium text-slate-950">{registration.sex ?? "—"}</p>
        </div>
        <div>
          <p className="text-slate-500">Idade</p>
          <p className="font-medium text-slate-950">{registration.age ?? "—"}</p>
        </div>
        <div>
          <p className="text-slate-500">Criada em</p>
          <p className="font-medium text-slate-950">{formatDate(registration.created_at)}</p>
        </div>
        <div>
          <p className="text-slate-500">Atualizada em</p>
          <p className="font-medium text-slate-950">{formatDate(registration.updated_at)}</p>
        </div>
      </div>

      {extraEntries.length > 0 ? (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary">Campos extras</Badge>
          </div>
          <div className="grid gap-2 text-sm md:grid-cols-2">
            {extraEntries.map(([key, value]) => (
              <div key={key} className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">{key}</p>
                <p className="mt-1 break-words font-medium text-slate-950">
                  {formatExtraValue(value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
