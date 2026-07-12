"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Debt } from "@prisma/client";
import { Alert } from "@/components/ui-legacy/card";
import { Field, Input, Select, Textarea } from "@/components/ui-legacy/field";
import { SubmitButton } from "@/components/ui-legacy/submit-button";
import { toDateInputValue } from "@/lib/format";

export function DebtForm({
  debt,
  action,
}: {
  debt?: Debt | null;
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean; id?: string }>;
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
          router.push(result?.id ? `/cliente/dividas/${result.id}` : "/cliente/dividas");
          router.refresh();
        });
      }}
    >
      {error ? (
        <div className="sm:col-span-2">
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}

      <Field label="Nome da dívida" htmlFor="name">
        <Input id="name" name="name" required defaultValue={debt?.name} />
      </Field>
      <Field label="Credor" htmlFor="creditor">
        <Input id="creditor" name="creditor" required defaultValue={debt?.creditor} />
      </Field>
      <Field label="Categoria" htmlFor="category">
        <Input id="category" name="category" required defaultValue={debt?.category ?? "Empréstimo"} />
      </Field>
      <Field label="Valor original (R$)" htmlFor="originalAmount">
        <Input
          id="originalAmount"
          name="originalAmount"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={debt?.originalAmount}
        />
      </Field>
      <Field label="Saldo em aberto (R$)" htmlFor="openBalance">
        <Input
          id="openBalance"
          name="openBalance"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={debt?.openBalance}
        />
      </Field>
      <Field label="Data de contratação" htmlFor="contractedAt">
        <Input
          id="contractedAt"
          name="contractedAt"
          type="date"
          required
          defaultValue={toDateInputValue(debt?.contractedAt ?? new Date())}
        />
      </Field>
      <Field label="Data de vencimento" htmlFor="dueDate">
        <Input
          id="dueDate"
          name="dueDate"
          type="date"
          required
          defaultValue={toDateInputValue(debt?.dueDate ?? new Date())}
        />
      </Field>
      <Field label="Quantidade de parcelas" htmlFor="installmentCount">
        <Input
          id="installmentCount"
          name="installmentCount"
          type="number"
          min="0"
          defaultValue={debt?.installmentCount ?? undefined}
        />
      </Field>
      <Field label="Valor da parcela (R$)" htmlFor="installmentValue">
        <Input
          id="installmentValue"
          name="installmentValue"
          type="number"
          step="0.01"
          min="0"
          defaultValue={debt?.installmentValue ?? undefined}
        />
      </Field>
      <Field label="Frequência" htmlFor="frequency">
        <Select id="frequency" name="frequency" defaultValue={debt?.frequency ?? "MENSAL"}>
          <option value="PAGAMENTO_UNICO">Pagamento único</option>
          <option value="SEMANAL">Semanal</option>
          <option value="MENSAL">Mensal</option>
          <option value="ANUAL">Anual</option>
        </Select>
      </Field>
      <Field label="Situação financeira" htmlFor="financialStatus">
        <Select
          id="financialStatus"
          name="financialStatus"
          defaultValue={debt?.financialStatus ?? "EM_ABERTO"}
        >
          <option value="EM_ABERTO">Em aberto</option>
          <option value="EM_NEGOCIACAO">Em negociação</option>
          <option value="RENEGOCIADO">Renegociado</option>
          <option value="PENDENTE">Pendente</option>
          <option value="PAGO">Pago</option>
          <option value="CANCELADO">Cancelado</option>
        </Select>
      </Field>
      <Field label="Aprovação" htmlFor="approvalStatus">
        <Select
          id="approvalStatus"
          name="approvalStatus"
          defaultValue={debt?.approvalStatus ?? "AGUARDANDO_APROVACAO"}
        >
          <option value="AGUARDANDO_APROVACAO">Aguardando aprovação</option>
          <option value="APROVADO">Aprovado</option>
          <option value="REPROVADO">Reprovado</option>
        </Select>
      </Field>
      <Field label="Prioridade" htmlFor="priority">
        <Select id="priority" name="priority" defaultValue={debt?.priority ?? "MEDIA"}>
          <option value="BAIXA">Baixa</option>
          <option value="MEDIA">Média</option>
          <option value="ALTA">Alta</option>
          <option value="URGENTE">Urgente</option>
        </Select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="Observações" htmlFor="notes">
          <Textarea id="notes" name="notes" defaultValue={debt?.notes ?? ""} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <SubmitButton>{debt ? "Salvar alterações" : "Cadastrar dívida"}</SubmitButton>
      </div>
    </form>
  );
}
