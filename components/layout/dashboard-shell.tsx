"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";
import { APP_NAME, adminDashboardNavLink, dashboardNavLinks } from "@/lib/constants";

export function DashboardShell({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const { isAdmin, isLoadingUser } = useAuth();
  const links = isAdmin ? [...dashboardNavLinks, adminDashboardNavLink] : dashboardNavLinks;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <Container className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-950">{APP_NAME}</p>
            <p className="text-sm text-slate-500">Painel de eventos, inscrições e Pix</p>
          </div>
          <nav className="flex flex-wrap items-center gap-3">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
              >
                {item.label}
              </Link>
            ))}
            {isLoadingUser ? <Spinner label="" className="h-4 w-4" /> : null}
          </nav>
        </Container>
      </div>
      <main>{children}</main>
    </div>
  );
}
