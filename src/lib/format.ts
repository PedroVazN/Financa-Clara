import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(date)) return "—";
  return format(date, "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(date)) return "—";
  return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function parseCurrencyInput(raw: string): number {
  const cleaned = raw
    .replace(/\s/g, "")
    .replace("R$", "")
    .replace(/\./g, "")
    .replace(",", ".");
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : 0;
}

export function toDateInputValue(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (!isValid(date)) return "";
  return format(date, "yyyy-MM-dd");
}
