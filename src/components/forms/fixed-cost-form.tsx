"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { FixedCost } from "@prisma/client";
import { Alert } from "@/components/ui-legacy/card";
import { Field, Input, Select, Textarea } from "@/components/ui-legacy/field";
import { SubmitButton } from "@/components/ui-legacy/submit-button";
import { toDateInputValue } from "@/lib/format";
import { FIXED_COST_CATEGORIES } from "@/lib/labels";

export function FixedCostForm({
  fixedCost,
  action,
}: {
  fixedCost?: FixedCost | null;
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
          router.push("/cliente/custos-fixos");
          router.refresh();
        });
      }}
    >
      {error ? (
        <div className="sm:col-span-2">
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}

      <Field label="Nome" htmlFor="name">
        <Input id="name" name="name" required defaultValue={fixedCost?.name} />
      </Field>
      <Field label="Categoria" htmlFor="category">
        <Select
          id="category"
          name="category"
          required
          defaultValue={fixedCost?.category ?? FIXED_COST_CATEGORIES[0]}
        >
          {FIXED_COST_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Valor (R$)" htmlFor="amount">
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={fixedCost?.amount}
        />
      </Field>
      <Field label="Frequência" htmlFor="frequency">
        <Select id="frequency" name="frequency" defaultValue={fixedCost?.frequency ?? "MENSAL"}>
          <option value="MENSAL">Mensal</option>
          <option value="ANUAL">Anual</option>
        </Select>
      </Field>
      <Field label="Dia de vencimento" htmlFor="dueDay">
        <Input
          id="dueDay"
          name="dueDay"
          type="number"
          min="1"
          max="31"
          required
          defaultValue={fixedCost?.dueDay ?? 1}
        />
      </Field>
      <Field label="Próximo vencimento" htmlFor="nextDueDate">
        <Input
          id="nextDueDate"
          name="nextDueDate"
          type="date"
          required
          defaultValue={toDateInputValue(fixedCost?.nextDueDate ?? new Date())}
        />
      </Field>
      <Field label="Forma de pagamento" htmlFor="paymentMethod">
        <Input
          id="paymentMethod"
          name="paymentMethod"
          defaultValue={fixedCost?.paymentMethod ?? ""}
          placeholder="Pix, boleto, cartão..."
        />
      </Field>
      <Field label="Situação financeira" htmlFor="financialStatus">
        <Select
          id="financialStatus"
          name="financialStatus"
          defaultValue={fixedCost?.financialStatus ?? "PENDENTE"}
        >
          <option value="PENDENTE">Pendente</option>
          <option value="PAGO">Pago</option>
        </Select>
      </Field>
      <Field label="Aprovação" htmlFor="approvalStatus">
        <Select
          id="approvalStatus"
          name="approvalStatus"
          defaultValue={fixedCost?.approvalStatus ?? "AGUARDANDO_APROVACAO"}
        >
          <option value="AGUARDANDO_APROVACAO">Aguardando aprovação</option>
          <option value="APROVADO">Aprovado</option>
          <option value="REPROVADO">Reprovado</option>
        </Select>
      </Field>
      <Field label="Comprovante (URL)" htmlFor="receiptUrl">
        <Input
          id="receiptUrl"
          name="receiptUrl"
          type="url"
          defaultValue={fixedCost?.receiptUrl ?? ""}
          placeholder="https://..."
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Observações" htmlFor="notes">
          <Textarea id="notes" name="notes" defaultValue={fixedCost?.notes ?? ""} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <SubmitButton>
          {fixedCost ? "Salvar alterações" : "Cadastrar custo fixo"}
        </SubmitButton>
      </div>
    </form>
  );
}
