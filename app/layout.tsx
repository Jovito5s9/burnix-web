import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Providers } from "@/components/layout/providers";

export const metadata: Metadata = {
  title: {
    default: "Burnix",
    template: "%s | Burnix",
  },
  description: "SaaS de inscrições e pagamentos com painel administrativo e fluxo de cobrança.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
