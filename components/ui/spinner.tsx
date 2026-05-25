import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type SpinnerProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;
};

export function Spinner({ className, label = "Carregando...", ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn("inline-flex items-center gap-2 text-sm text-slate-600", className)}
      {...props}
    >
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
      <span>{label}</span>
    </div>
  );
}
