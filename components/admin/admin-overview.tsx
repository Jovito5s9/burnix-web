"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminClientsTable } from "@/components/admin/admin-clients-table";
import { AdminEventsTable } from "@/components/admin/admin-events-table";
import { AdminPaymentsTable } from "@/components/admin/admin-payments-table";
import { AdminUsersTable } from "@/components/admin/admin-users-table";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useAdminClients, useAdminEvents, useAdminPayments, useAdminUsers } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { ApiClientError, getErrorMessage } from "@/lib/get-error-message";

const ADMIN_LIMIT = 50;
const MAX_ADMIN_LIMIT = 500;

type ResourceKey = "users" | "events" | "clients" | "payments";

type PaginationState = Record<ResourceKey, number>;

function getStatusCode(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.status;
  }

  return typeof (error as { status?: unknown } | null)?.status === "number"
    ? ((error as { status: number }).status)
    : undefined;
}

function getTotalLabel(total: number | null, fallbackCount: number) {
  return total === null ? `${fallbackCount}+` : String(total);
}

export function AdminOverview() {
  const { user, isAdmin, isLoadingUser } = useAuth();
  const [skip, setSkip] = useState<PaginationState>({
    users: 0,
    events: 0,
    clients: 0,
    payments: 0,
  });

  const enabled = Boolean(isAdmin);
  const usersQuery = useAdminUsers({ skip: skip.users, limit: ADMIN_LIMIT }, enabled);
  const eventsQuery = useAdminEvents({ skip: skip.events, limit: ADMIN_LIMIT }, enabled);
  const clientsQuery = useAdminClients({ skip: skip.clients, limit: ADMIN_LIMIT }, enabled);
  const paymentsQuery = useAdminPayments({ skip: skip.payments, limit: ADMIN_LIMIT }, enabled);

  function goPrevious(resource: ResourceKey) {
    setSkip((current) => ({
      ...current,
      [resource]: Math.max(0, current[resource] - ADMIN_LIMIT),
    }));
  }

  function goNext(resource: ResourceKey) {
    setSkip((current) => ({
      ...current,
      [resource]: current[resource] + ADMIN_LIMIT,
    }));
  }

  if (isLoadingUser) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner label="Verificando permissões administrativas..." />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <section className="py-8">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
          <Alert variant="destructive" title="Sem permissão">
            <div className="space-y-3">
              <p>
                O painel administrativo é exibido apenas para usuários com role `admin`, `superuser` ou `super_user`.
              </p>
              <p className="text-sm text-red-900/80">
                Role atual: {user?.role ?? "não identificada"}.
              </p>
              <Button asChild variant="secondary">
                <Link href="/dashboard">Voltar para o dashboard</Link>
              </Button>
            </div>
          </Alert>
        </div>
      </section>
    );
  }

  const queries = [usersQuery, eventsQuery, clientsQuery, paymentsQuery];
  const firstError = queries.find((query) => query.error)?.error;
  const isForbidden = getStatusCode(firstError) === 403;

  if (firstError && isForbidden) {
    return (
      <section className="py-8">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
          <Alert variant="destructive" title="Sem permissão">
            <div className="space-y-3">
              <p>
                O backend recusou o acesso às rotas `/admin/*`. Confirme se o usuário possui role administrativa.
              </p>
              <p className="text-sm text-red-900/80">{getErrorMessage(firstError, "Acesso negado.")}</p>
              <Button asChild variant="secondary">
                <Link href="/dashboard">Voltar para o dashboard</Link>
              </Button>
            </div>
          </Alert>
        </div>
      </section>
    );
  }

  const users = usersQuery.data;
  const events = eventsQuery.data;
  const clients = clientsQuery.data;
  const payments = paymentsQuery.data;
  const isInitialLoading = queries.some((query) => query.isLoading);

  return (
    <section className="py-8">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3">
          <Badge>Admin</Badge>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Painel administrativo
              </h1>
              <p className="mt-2 max-w-3xl text-slate-600">
                Área preparada para consultar usuários, eventos, participantes e pagamentos pelas rotas
                administrativas do backend, com paginação por `skip` e `limit` máximo de {MAX_ADMIN_LIMIT}.
              </p>
            </div>
            <Button asChild variant="secondary">
              <Link href="/dashboard">Voltar para dashboard</Link>
            </Button>
          </div>
        </div>

        {firstError ? (
          <div className="mb-6">
            <Alert variant="warning" title="Alguns dados administrativos não foram carregados">
              <p>{getErrorMessage(firstError, "Não foi possível carregar uma das rotas administrativas.")}</p>
            </Alert>
          </div>
        ) : null}

        {isInitialLoading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Spinner label="Carregando dados administrativos..." />
          </div>
        ) : (
          <>
            <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardDescription>Usuários</CardDescription>
                  <CardTitle>{getTotalLabel(users?.total ?? null, users?.items.length ?? 0)}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-600">Origem: `GET /admin/users`.</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardDescription>Eventos</CardDescription>
                  <CardTitle>{getTotalLabel(events?.total ?? null, events?.items.length ?? 0)}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-600">Origem: `GET /admin/contracts`.</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardDescription>Participantes</CardDescription>
                  <CardTitle>{getTotalLabel(clients?.total ?? null, clients?.items.length ?? 0)}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-600">Origem: `GET /admin/clients`.</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardDescription>Pagamentos</CardDescription>
                  <CardTitle>{getTotalLabel(payments?.total ?? null, payments?.items.length ?? 0)}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-600">Origem: `GET /admin/payments`.</CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Usuários</CardTitle>
                  <CardDescription>Consulta administrativa paginada de contas cadastradas.</CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminUsersTable
                    users={users?.items ?? []}
                    total={users?.total ?? null}
                    skip={users?.skip ?? skip.users}
                    limit={users?.limit ?? ADMIN_LIMIT}
                    hasMore={users?.hasMore ?? false}
                    isFetching={usersQuery.isFetching}
                    onPrevious={() => goPrevious("users")}
                    onNext={() => goNext("users")}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Eventos</CardTitle>
                  <CardDescription>Consulta administrativa dos contratos/eventos.</CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminEventsTable
                    events={events?.items ?? []}
                    total={events?.total ?? null}
                    skip={events?.skip ?? skip.events}
                    limit={events?.limit ?? ADMIN_LIMIT}
                    hasMore={events?.hasMore ?? false}
                    isFetching={eventsQuery.isFetching}
                    onPrevious={() => goPrevious("events")}
                    onNext={() => goNext("events")}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Participantes</CardTitle>
                  <CardDescription>Consulta administrativa de clients/inscrições.</CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminClientsTable
                    clients={clients?.items ?? []}
                    total={clients?.total ?? null}
                    skip={clients?.skip ?? skip.clients}
                    limit={clients?.limit ?? ADMIN_LIMIT}
                    hasMore={clients?.hasMore ?? false}
                    isFetching={clientsQuery.isFetching}
                    onPrevious={() => goPrevious("clients")}
                    onNext={() => goNext("clients")}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pagamentos</CardTitle>
                  <CardDescription>Consulta administrativa de pagamentos Pix/OpenPix.</CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminPaymentsTable
                    payments={payments?.items ?? []}
                    total={payments?.total ?? null}
                    skip={payments?.skip ?? skip.payments}
                    limit={payments?.limit ?? ADMIN_LIMIT}
                    hasMore={payments?.hasMore ?? false}
                    isFetching={paymentsQuery.isFetching}
                    onPrevious={() => goPrevious("payments")}
                    onNext={() => goNext("payments")}
                  />
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
