"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Expense } from "@prisma/client";
import { Alert } from "@/components/ui-legacy/card";
import { Field, Input, Select, Textarea } from "@/components/ui-legacy/field";
import { SubmitButton } from "@/components/ui-legacy/submit-button";
import { toDateInputValue } from "@/lib/format";

export function ExpenseForm({
  expense,
  action,
}: {
  expense?: Expense | null;
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      action={(formData) => {
        startTransition(async () => {
          const result = await action(formData);
          if (result?.error) {
            setError(result.error);
            return;
          }
          router.push("/cliente/saidas");
          router.refresh();
        });
      }}
    >
      {error ? (
        <div className="sm:col-span-2">
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}

      <Field label="Descrição" htmlFor="description">
        <Input
          id="description"
          name="description"
          required
          defaultValue={expense?.description}
        />
      </Field>
      <Field label="Categoria" htmlFor="category">
        <Input
          id="category"
          name="category"
          required
          defaultValue={expense?.category ?? "Alimentação"}
        />
      </Field>
      <Field label="Valor (R$)" htmlFor="amount">
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={expense?.amount}
        />
      </Field>
      <Field label="Data" htmlFor="date">
        <Input
          id="date"
          name="date"
          type="date"
          required
          defaultValue={toDateInputValue(expense?.date ?? new Date())}
        />
      </Field>
      <Field label="Forma de pagamento" htmlFor="paymentMethod">
        <Input
          id="paymentMethod"
          name="paymentMethod"
          defaultValue={expense?.paymentMethod ?? ""}
          placeholder="Pix, dinheiro, cartão..."
        />
      </Field>
      <Field label="Recorrência" htmlFor="recurrence">
        <Select id="recurrence" name="recurrence" defaultValue={expense?.recurrence ?? "UNICA"}>
          <option value="UNICA">Única</option>
          <option value="SEMANAL">Semanal</option>
          <option value="MENSAL">Mensal</option>
          <option value="ANUAL">Anual</option>
        </Select>
      </Field>
      <Field label="Situação financeira" htmlFor="financialStatus">
        <Select
          id="financialStatus"
          name="financialStatus"
          defaultValue={expense?.financialStatus ?? "PENDENTE"}
        >
          <option value="PENDENTE">Pendente</option>
          <option value="PAGO">Pago</option>
          <option value="CANCELADO">Cancelado</option>
        </Select>
      </Field>
      <Field label="Aprovação" htmlFor="approvalStatus">
        <Select
          id="approvalStatus"
          name="approvalStatus"
          defaultValue={expense?.approvalStatus ?? "AGUARDANDO_APROVACAO"}
        >
          <option value="AGUARDANDO_APROVACAO">Aguardando aprovação</option>
          <option value="APROVADO">Aprovado</option>
          <option value="REPROVADO">Reprovado</option>
        </Select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="Observações" htmlFor="notes">
          <Textarea id="notes" name="notes" defaultValue={expense?.notes ?? ""} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <SubmitButton>{expense ? "Salvar alterações" : "Cadastrar saída"}</SubmitButton>
      </div>
    </form>
  );
}
