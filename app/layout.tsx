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
  description: "Inscrições em eventos e pagamentos por Pix em uma experiência simples e segura.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body>
        <Providers>
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
