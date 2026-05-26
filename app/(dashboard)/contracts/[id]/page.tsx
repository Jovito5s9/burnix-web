import { ContractDetail } from "@/components/dashboard/contract-detail";

type ContractDetailsPageProps = {
  params: {
    id: string;
  };
};

export default function ContractDetailsPage({ params }: ContractDetailsPageProps) {
  return <ContractDetail id={params.id} />;
}
