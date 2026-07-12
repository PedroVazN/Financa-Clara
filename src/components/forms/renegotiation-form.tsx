"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { DebtRenegotiation } from "@prisma/client";
import { Alert } from "@/components/ui-legacy/card";
import { Field, Input, Select, Textarea } from "@/components/ui-legacy/field";
import { SubmitButton } from "@/components/ui-legacy/submit-button";
import { toDateInputValue } from "@/lib/format";

export function RenegotiationForm({
  debtId,
  renegotiation,
  action,
}: {
  debtId: string;
  renegotiation?: DebtRenegotiation | null;
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
          router.push(`/cliente/dividas/${debtId}`);
          router.refresh();
        });
      }}
    >
      {error ? (
        <div className="sm:col-span-2">
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}

      <Field label="Data da renegociação" htmlFor="renegotiatedAt">
        <Input
          id="renegotiatedAt"
          name="renegotiatedAt"
          type="date"
          required
          defaultValue={toDateInputValue(renegotiation?.renegotiatedAt ?? new Date())}
        />
      </Field>
      <Field label="Valor total acordado (R$)" htmlFor="totalAmount">
        <Input
          id="totalAmount"
          name="totalAmount"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={renegotiation?.totalAmount}
        />
      </Field>
      <Field label="Entrada (R$)" htmlFor="downPayment">
        <Input
          id="downPayment"
          name="downPayment"
          type="number"
          step="0.01"
          min="0"
          defaultValue={renegotiation?.downPayment ?? undefined}
        />
      </Field>
      <Field label="Valor de cada pagamento (R$)" htmlFor="paymentAmount">
        <Input
          id="paymentAmount"
          name="paymentAmount"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={renegotiation?.paymentAmount}
        />
      </Field>
      <Field label="Quantidade de pagamentos" htmlFor="paymentCount">
        <Input
          id="paymentCount"
          name="paymentCount"
          type="number"
          min="1"
          required
          defaultValue={renegotiation?.paymentCount ?? 1}
        />
      </Field>
      <Field label="Frequência" htmlFor="frequency">
        <Select id="frequency" name="frequency" defaultValue={renegotiation?.frequency ?? "MENSAL"}>
          <option value="SEMANAL">Semanal</option>
          <option value="MENSAL">Mensal</option>
        </Select>
      </Field>
      <Field label="Primeiro pagamento" htmlFor="firstPaymentDate">
        <Input
          id="firstPaymentDate"
          name="firstPaymentDate"
          type="date"
          required
          defaultValue={toDateInputValue(renegotiation?.firstPaymentDate ?? new Date())}
        />
      </Field>
      <Field label="Canal de contato" htmlFor="channel">
        <Select id="channel" name="channel" defaultValue={renegotiation?.channel ?? "OUTRO"}>
          <option value="TELEFONE">Telefone</option>
          <option value="APLICATIVO">Aplicativo</option>
          <option value="SITE">Site</option>
          <option value="PRESENCIAL">Presencial</option>
          <option value="OUTRO">Outro</option>
        </Select>
      </Field>
      <Field label="Atendente" htmlFor="attendantName">
        <Input
          id="attendantName"
          name="attendantName"
          defaultValue={renegotiation?.attendantName ?? ""}
        />
      </Field>
      <Field label="Protocolo" htmlFor="protocolNumber">
        <Input
          id="protocolNumber"
          name="protocolNumber"
          defaultValue={renegotiation?.protocolNumber ?? ""}
        />
      </Field>
      <Field label="Status" htmlFor="status">
        <Select id="status" name="status" defaultValue={renegotiation?.status ?? "AGUARDANDO_APROVACAO"}>
          <option value="AGUARDANDO_APROVACAO">Aguardando aprovação</option>
          <option value="APROVADA">Aprovada</option>
          <option value="REPROVADA">Reprovada</option>
          <option value="ATIVA">Ativa</option>
          <option value="CONCLUIDA">Concluída</option>
          <option value="CANCELADA">Cancelada</option>
        </Select>
      </Field>
      <Field label="Anexo (URL)" htmlFor="attachmentUrl">
        <Input
          id="attachmentUrl"
          name="attachmentUrl"
          type="url"
          defaultValue={renegotiation?.attachmentUrl ?? ""}
          placeholder="https://..."
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Descrição do acordo" htmlFor="agreementDesc">
          <Textarea
            id="agreementDesc"
            name="agreementDesc"
            required
            defaultValue={renegotiation?.agreementDesc ?? ""}
          />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Observações" htmlFor="notes">
          <Textarea id="notes" name="notes" defaultValue={renegotiation?.notes ?? ""} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <SubmitButton>Registrar renegociação</SubmitButton>
      </div>
    </form>
  );
}
