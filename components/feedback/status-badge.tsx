import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getContractStatusLabel, getPaymentStatusLabel } from "@/lib/format";
import type { ContractStatus } from "@/types/contract";
import type { PaymentStatus } from "@/types/payment";

type ContractStatusBadgeProps = {
  kind: "contract";
  status: ContractStatus;
};

type PaymentStatusBadgeProps = {
  kind: "payment";
  status: PaymentStatus;
};

type StatusBadgeProps = ContractStatusBadgeProps | PaymentStatusBadgeProps;

export function StatusBadge(props: StatusBadgeProps) {
  if (props.kind === "contract") {
    const variantMap: Record<ContractStatus, "default" | "secondary" | "outline" | "success" | "warning"> = {
      draft: "secondary",
      published: "success",
      closed: "outline",
      cancelled: "outline",
    };

    return (
      <Badge
        variant={variantMap[props.status]}
        className={cn(props.status === "cancelled" ? "text-red-700" : undefined)}
      >
        {getContractStatusLabel(props.status)}
      </Badge>
    );
  }

  const paymentClassMap: Record<PaymentStatus, string> = {
    pending: "bg-amber-100 text-amber-800",
    paid: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    expired: "bg-slate-100 text-slate-700",
    error: "bg-red-100 text-red-700",
    refunded: "bg-slate-100 text-slate-700",
  };

  return (
    <Badge variant="secondary" className={paymentClassMap[props.status]}>
      {getPaymentStatusLabel(props.status)}
    </Badge>
  );
}
