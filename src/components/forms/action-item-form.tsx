"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert } from "@/components/ui-legacy/card";
import { Field, Input, Select, Textarea } from "@/components/ui-legacy/field";
import { SubmitButton } from "@/components/ui-legacy/submit-button";
import { toDateInputValue } from "@/lib/format";

type ActionResult = {
  error?: string;
  success?: boolean;
};

export function ActionItemForm({
  action,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
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

          formData.forEach((_, key) => {
            const field = document.querySelector(`[name="${key}"]`) as HTMLInputElement | null;
            if (field && !["priority", "category", "pointsAwarded"].includes(key)) {
              field.value = "";
            }
          });
          router.refresh();
        });
      }}
    >
      {error ? (
        <div className="sm:col-span-2">
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}

      <div className="sm:col-span-2">
        <Field label="Título da ação" htmlFor="title">
          <Input id="title" name="title" required />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field label="Descrição" htmlFor="description">
          <Textarea id="description" name="description" />
        </Field>
      </div>

      <Field label="Categoria" htmlFor="category">
        <Select id="category" name="category" defaultValue="ORGANIZACAO">
          <option value="PAGAMENTO">Pagamento</option>
          <option value="ORGANIZACAO">Organização</option>
          <option value="RENEGOCIACAO">Renegociação</option>
          <option value="RESERVA_FINANCEIRA">Reserva financeira</option>
          <option value="ATUALIZACAO_CADASTRAL">Atualização cadastral</option>
          <option value="CONTATO_COM_CREDOR">Contato com credor</option>
          <option value="OUTRO">Outro</option>
        </Select>
      </Field>

      <Field label="Prioridade" htmlFor="priority">
        <Select id="priority" name="priority" defaultValue="MEDIA">
          <option value="BAIXA">Baixa</option>
          <option value="MEDIA">Média</option>
          <option value="ALTA">Alta</option>
          <option value="URGENTE">Urgente</option>
        </Select>
      </Field>

      <Field label="Referência" htmlFor="relatedItemLabel" hint="Ex.: conta de luz, acordo do banco">
        <Input id="relatedItemLabel" name="relatedItemLabel" />
      </Field>

      <Field label="Valor relacionado (R$)" htmlFor="relatedAmount">
        <Input id="relatedAmount" name="relatedAmount" type="number" step="0.01" min="0" />
      </Field>

      <Field label="Prazo" htmlFor="dueDate">
        <Input
          id="dueDate"
          name="dueDate"
          type="date"
          required
          defaultValue={toDateInputValue(new Date())}
        />
      </Field>

      <Field label="Pontos" htmlFor="pointsAwarded">
        <Input
          id="pointsAwarded"
          name="pointsAwarded"
          type="number"
          min="0"
          step="1"
          defaultValue={20}
        />
      </Field>

      <div className="sm:col-span-2">
        <Field label="Orientação para o cliente" htmlFor="guidance">
          <Textarea id="guidance" name="guidance" />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <SubmitButton>Adicionar ação</SubmitButton>
      </div>
    </form>
  );
}
