import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";
import type { AdminUser } from "@/types/admin";

type AdminUsersTableProps = {
  users: AdminUser[];
  total: number | null;
  skip: number;
  limit: number;
  hasMore: boolean;
  isFetching?: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

function getUserProfileLabel(role: string) {
  return ["admin", "superuser", "super_user"].includes(role)
    ? "Administrador"
    : "Organizador";
}

function PaginationFooter({ total, skip, limit, hasMore, isFetching, onPrevious, onNext }: Omit<AdminUsersTableProps, "users">) {
  const page = Math.floor(skip / limit) + 1;

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
      <p>Página {page}{total !== null ? ` · ${total} usuários` : ""}</p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={skip === 0 || isFetching} onClick={onPrevious}>Anterior</Button>
        <Button variant="secondary" size="sm" disabled={!hasMore || isFetching} onClick={onNext}>Próxima</Button>
      </div>
    </div>
  );
}

export function AdminUsersTable(props: AdminUsersTableProps) {
  const { users } = props;

  if (users.length === 0) {
    return (
      <div>
        <EmptyState title="Nenhum usuário encontrado" description="Não há usuários para exibir nesta página." />
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
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Perfil</th>
                <th className="px-4 py-3">Situação</th>
                <th className="px-4 py-3">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-medium text-slate-950">#{user.id}</td>
                  <td className="px-4 py-3 text-slate-700">{user.email}</td>
                  <td className="px-4 py-3 text-slate-700">{getUserProfileLabel(user.role)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={user.is_active ? "success" : "secondary"}>
                      {user.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(user.created_at)}</td>
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
