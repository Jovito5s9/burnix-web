import Link from "next/link";
import { StatusBadge } from "@/components/feedback/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import type { AdminEvent } from "@/types/admin";

type AdminEventsTableProps = {
  events: AdminEvent[];
  total: number | null;
  skip: number;
  limit: number;
  hasMore: boolean;
  isFetching?: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

function PaginationFooter({ total, skip, limit, hasMore, isFetching, onPrevious, onNext }: Omit<AdminEventsTableProps, "events">) {
  const page = Math.floor(skip / limit) + 1;

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
      <p>Página {page}{total !== null ? ` · ${total} eventos` : ""}</p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={skip === 0 || isFetching} onClick={onPrevious}>Anterior</Button>
        <Button variant="secondary" size="sm" disabled={!hasMore || isFetching} onClick={onNext}>Próxima</Button>
      </div>
    </div>
  );
}

export function AdminEventsTable(props: AdminEventsTableProps) {
  const { events } = props;

  if (events.length === 0) {
    return (
      <div>
        <EmptyState title="Nenhum evento encontrado" description="Não há eventos para exibir nesta página." />
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
                <th className="px-4 py-3">Evento</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Situação</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">Capacidade</th>
                <th className="px-4 py-3">Criado em</th>
                <th className="px-4 py-3">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="px-4 py-3 font-medium text-slate-950">#{event.id}</td>
                  <td className="px-4 py-3 text-slate-700">{event.title}</td>
                  <td className="px-4 py-3"><StatusBadge kind="contract" status={event.status} /></td>
                  <td className="px-4 py-3 text-slate-700">{formatCurrency(Number(event.price), event.currency)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatNumber(event.capacity)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(event.created_at)}</td>
                  <td className="px-4 py-3">
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/contracts/${event.id}`}>Abrir</Link>
                    </Button>
                  </td>
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
