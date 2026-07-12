import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("glass rounded-2xl p-5", className)}>{children}</div>
  );
}

export function StatCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon ? (
          <div className="rounded-xl bg-secondary p-2 text-primary dark:bg-accent dark:text-primary">
            {icon}
          </div>
        ) : null}
      </div>
      <p className="font-display text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/40 px-6 py-12 text-center dark:bg-accent/30">
      <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Alert({
  children,
  variant = "success",
}: {
  children: ReactNode;
  variant?: "success" | "error" | "info";
}) {
  const styles = {
    success: "border-leaf/30 bg-secondary text-foreground dark:bg-accent dark:text-foreground",
    error: "border-destructive/30 bg-destructive/10 text-destructive",
    info: "border-border bg-secondary text-secondary-foreground",
  };
  return (
    <div
      role="status"
      className={cn("rounded-xl border px-4 py-3 text-sm", styles[variant])}
    >
      {children}
    </div>
  );
}
