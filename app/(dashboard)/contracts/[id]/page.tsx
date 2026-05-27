import { ContractDetail } from "@/components/dashboard/contract-detail";

type ContractDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ContractDetailsPage({
  params,
}: ContractDetailsPageProps) {
  const { id } = await params;

  return <ContractDetail id={id} />;
}