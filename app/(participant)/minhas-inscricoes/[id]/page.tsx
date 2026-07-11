import type { Metadata } from "next";

import { ParticipantRegistrationDetail } from "@/components/participant/participant-registration-detail";

export const metadata: Metadata = {
  title: "Detalhes da inscrição",
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return <ParticipantRegistrationDetail id={id} />;
}
