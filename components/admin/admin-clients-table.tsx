import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";
import type { AdminClient } from "@/types/admin";

type AdminClientsTableProps = {
  clients: AdminClient[];
  total: number | null;
  skip: number;
  limit: number;
  hasMore: boolean;
  isFetching?: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

function PaginationFooter({ total, skip, limit, hasMore, isFetching, onPrevious, onNext }: Omit<AdminClientsTableProps, "clients">) {
  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
      <p>Página por `skip={skip}` e `limit={limit}`{total !== null ? ` · Total: ${total}` : ""}.</p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={skip === 0 || isFetching} onClick={onPrevious}>Anterior</Button>
        <Button variant="secondary" size="sm" disabled={!hasMore || isFetching} onClick={onNext}>Próxima</Button>
      </div>
    </div>
  );
}

export function AdminClientsTable(props: AdminClientsTableProps) {
  const { clients } = props;

  if (clients.length === 0) {
    return (
      <div>
        <EmptyState title="Nenhum participante encontrado" description="A rota /admin/clients não retornou registros para esta página." />
        <PaginationFooter {...props} />
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Evento</th>
                <th className="px-4 py-3">Inscrição</th>
                <th className="px-4 py-3">Pagamento</th>
                <th className="px-4 py-3">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {clients.map((client) => (
                <tr key={client.id}>
                  <td className="px-4 py-3 font-medium text-slate-950">{client.id}</td>
                  <td className="px-4 py-3 text-slate-700">{client.name}</td>
                  <td className="px-4 py-3 text-slate-700">{client.email ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {client.contract_id ? (
                      <Link className="font-medium text-slate-950 underline-offset-4 hover:underline" href={`/contracts/${client.contract_id}`}>
                        {client.contract_id}
                      </Link>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{client.registration_status}</td>
                  <td className="px-4 py-3 text-slate-700">{client.payment_status}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(client.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <PaginationFooter {...props} />
    </div>
  );
}
