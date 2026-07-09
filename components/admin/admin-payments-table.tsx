import Link from "next/link";
import { StatusBadge } from "@/components/feedback/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate, getReadableMethod } from "@/lib/format";
import type { AdminPayment } from "@/types/admin";

type AdminPaymentsTableProps = {
  payments: AdminPayment[];
  total: number | null;
  skip: number;
  limit: number;
  hasMore: boolean;
  isFetching?: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

function PaginationFooter({ total, skip, limit, hasMore, isFetching, onPrevious, onNext }: Omit<AdminPaymentsTableProps, "payments">) {
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

export function AdminPaymentsTable(props: AdminPaymentsTableProps) {
  const { payments } = props;

  if (payments.length === 0) {
    return (
      <div>
        <EmptyState title="Nenhum pagamento encontrado" description="A rota /admin/payments não retornou registros para esta página." />
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
                <th className="px-4 py-3">Evento</th>
                <th className="px-4 py-3">Pagador</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-3 font-medium text-slate-950">{payment.id}</td>
                  <td className="px-4 py-3 text-slate-700">
                    <Link className="font-medium text-slate-950 underline-offset-4 hover:underline" href={`/contracts/${payment.contract_id}`}>
                      {payment.contract_id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {payment.payer_name ?? payment.payer_email ?? "—"}
                  </td>
                  <td className="px-4 py-3"><StatusBadge kind="payment" status={payment.status} /></td>
                  <td className="px-4 py-3 text-slate-700">{formatCurrency(Number(payment.amount), payment.currency)}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {payment.provider} · {getReadableMethod(payment.payment_method ?? payment.method)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(payment.created_at)}</td>
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
