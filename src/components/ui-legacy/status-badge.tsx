import { cn } from "@/lib/utils";
import {
  APPROVAL_STATUS_LABELS,
  FINANCIAL_STATUS_LABELS,
  PRIORITY_LABELS,
} from "@/lib/labels";

const financialStyles: Record<string, string> = {
  PAGO: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800",
  RECEBIDO: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800",
  PENDENTE: "bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800",
  EM_ABERTO: "bg-sky-100 text-sky-950 border-sky-300 dark:bg-sky-950 dark:text-sky-200 dark:border-sky-800",
  EM_NEGOCIACAO: "bg-indigo-100 text-indigo-950 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-200 dark:border-indigo-800",
  RENEGOCIADO: "bg-accent text-foreground border-border",
  CANCELADO: "bg-muted text-muted-foreground border-border",
};

const approvalStyles: Record<string, string> = {
  APROVADO: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800",
  REPROVADO: "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800",
  AGUARDANDO_APROVACAO: "bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800",
};

const priorityStyles: Record<string, string> = {
  BAIXA: "bg-muted text-muted-foreground border-border",
  MEDIA: "bg-sky-100 text-sky-950 border-sky-300 dark:bg-sky-950 dark:text-sky-200 dark:border-sky-800",
  ALTA: "bg-orange-100 text-orange-950 border-orange-300 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-800",
  URGENTE: "bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800",
};

export function StatusBadge({
  status,
  kind = "financial",
}: {
  status: string;
  kind?: "financial" | "approval" | "priority" | "custom";
  label?: string;
}) {
  const label =
    kind === "financial"
      ? FINANCIAL_STATUS_LABELS[status] ?? status
      : kind === "approval"
        ? APPROVAL_STATUS_LABELS[status] ?? status
        : kind === "priority"
          ? PRIORITY_LABELS[status] ?? status
          : status;

  const style =
    kind === "financial"
      ? financialStyles[status]
      : kind === "approval"
        ? approvalStyles[status]
        : kind === "priority"
          ? priorityStyles[status]
          : "bg-muted text-foreground border-border";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        style,
      )}
      role="status"
    >
      <span
        className="h-1.5 w-1.5 rounded-full bg-current opacity-70"
        aria-hidden
      />
      {label}
    </span>
  );
}
