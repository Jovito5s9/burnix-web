"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APP_NAME, navLinks } from "@/lib/constants";

const protectedPrefixes = ["/dashboard", "/contracts", "/payments", "/settings"];

export function Navbar() {
  const pathname = usePathname();
  const isProtectedRoute = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isProtectedRoute) {
    return null;
  }

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white">
            B
          </span>
          <div className="leading-tight">
            <p className="font-semibold text-slate-950">{APP_NAME}</p>
            <p className="text-xs text-slate-500">Eventos públicos, inscrições e pagamentos</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden sm:inline-flex">
            MVP
          </Badge>
          <Button variant="secondary" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
        </div>
      </Container>
    </header>
  );
}
