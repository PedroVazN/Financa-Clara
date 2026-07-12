"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui-legacy/field";
import { SubmitButton } from "@/components/ui-legacy/submit-button";
import { Alert } from "@/components/ui-legacy/card";
import { toDateInputValue } from "@/lib/format";
import type { Income } from "@prisma/client";

export function IncomeForm({
  income,
  action,
}: {
  income?: Income | null;
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
          router.push("/cliente/entradas");
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
          defaultValue={income?.description}
        />
      </Field>
      <Field label="Categoria" htmlFor="category">
        <Input
          id="category"
          name="category"
          required
          defaultValue={income?.category ?? "Trabalho"}
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
          defaultValue={income?.amount}
        />
      </Field>
      <Field label="Data de recebimento" htmlFor="receivedAt">
        <Input
          id="receivedAt"
          name="receivedAt"
          type="date"
          required
          defaultValue={toDateInputValue(income?.receivedAt ?? new Date())}
        />
      </Field>
      <Field label="Tipo de entrada" htmlFor="incomeType">
        <Select
          id="incomeType"
          name="incomeType"
          defaultValue={income?.incomeType ?? "SALARIO"}
        >
          <option value="SALARIO">Salário</option>
          <option value="BENEFICIO">Benefício</option>
          <option value="TRABALHO_EXTRA">Trabalho extra</option>
          <option value="PENSAO">Pensão</option>
          <option value="VENDA">Venda</option>
          <option value="OUTRO">Outro</option>
        </Select>
      </Field>
      <Field label="Recorrência" htmlFor="recurrence">
        <Select
          id="recurrence"
          name="recurrence"
          defaultValue={income?.recurrence ?? "UNICA"}
        >
          <option value="UNICA">Única</option>
          <option value="SEMANAL">Semanal</option>
          <option value="MENSAL">Mensal</option>
          <option value="ANUAL">Anual</option>
        </Select>
      </Field>
      <Field label="Início da recorrência" htmlFor="recurrenceStart">
        <Input
          id="recurrenceStart"
          name="recurrenceStart"
          type="date"
          defaultValue={toDateInputValue(income?.recurrenceStart)}
        />
      </Field>
      <Field label="Término da recorrência (opcional)" htmlFor="recurrenceEnd">
        <Input
          id="recurrenceEnd"
          name="recurrenceEnd"
          type="date"
          defaultValue={toDateInputValue(income?.recurrenceEnd)}
        />
      </Field>
      <Field label="Situação financeira" htmlFor="financialStatus">
        <Select
          id="financialStatus"
          name="financialStatus"
          defaultValue={income?.financialStatus ?? "PENDENTE"}
        >
          <option value="RECEBIDO">Recebido</option>
          <option value="PENDENTE">Pendente</option>
          <option value="CANCELADO">Cancelado</option>
        </Select>
      </Field>
      <Field label="Aprovação" htmlFor="approvalStatus">
        <Select
          id="approvalStatus"
          name="approvalStatus"
          defaultValue={income?.approvalStatus ?? "AGUARDANDO_APROVACAO"}
        >
          <option value="AGUARDANDO_APROVACAO">Aguardando aprovação</option>
          <option value="APROVADO">Aprovado</option>
          <option value="REPROVADO">Reprovado</option>
        </Select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="Observações" htmlFor="notes">
          <Textarea id="notes" name="notes" defaultValue={income?.notes ?? ""} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <SubmitButton>{income ? "Salvar alterações" : "Cadastrar entrada"}</SubmitButton>
      </div>
    </form>
  );
}
