import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "outline";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-[color-mix(in_srgb,var(--canopy),black_10%)] focus-visible:ring-leaf",
  secondary:
    "bg-secondary text-foreground hover:bg-accent focus-visible:ring-leaf dark:bg-secondary dark:text-secondary-foreground",
  danger:
    "bg-destructive text-white hover:opacity-90 focus-visible:ring-destructive",
  ghost: "bg-transparent text-foreground hover:bg-accent",
  outline:
    "border border-border bg-card text-foreground hover:bg-accent focus-visible:ring-leaf",
};

export function Button({
  className,
  variant = "primary",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
