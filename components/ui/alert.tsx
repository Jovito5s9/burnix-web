import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type AlertVariant = "info" | "success" | "warning" | "destructive";

type AlertProps = HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
};

const alertVariants: Record<AlertVariant, string> = {
  info: "border-slate-200 bg-slate-50 text-slate-900",
  success: "border-green-200 bg-green-50 text-green-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  destructive: "border-red-200 bg-red-50 text-red-900",
};

export function Alert({ className, variant = "info", title, children, ...props }: AlertProps) {
  return (
    <div className={cn("rounded-2xl border px-4 py-3 text-sm", alertVariants[variant], className)} {...props}>
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={cn(title ? "mt-1" : undefined)}>{children}</div>
    </div>
  );
}
