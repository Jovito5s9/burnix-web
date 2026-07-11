import type { Metadata } from "next";

import { MyRegistrationsPage } from "@/components/participant/my-registrations-page";

export const metadata: Metadata = {
  title: "Minhas inscrições",
  description: "Acompanhe suas inscrições e pagamentos de eventos.",
};

export default function Page() {
  return <MyRegistrationsPage />;
}
