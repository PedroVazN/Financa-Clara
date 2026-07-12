"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ActionPlan } from "@prisma/client";
import { Alert } from "@/components/ui-legacy/card";
import { Field, Input, Select, Textarea } from "@/components/ui-legacy/field";
import { SubmitButton } from "@/components/ui-legacy/submit-button";
import { toDateInputValue } from "@/lib/format";

type ActionResult = {
  error?: string;
  success?: boolean;
  id?: string;
};

export function ActionPlanForm({
  plan,
  action,
  redirectTo,
}: {
  plan?: ActionPlan | null;
  action: (formData: FormData) => Promise<ActionResult>;
  redirectTo?: string;
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

          router.push(redirectTo ?? (result?.id ? `/gestor/planos/${result.id}` : "/gestor/planos"));
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
        <Field label="Título" htmlFor="title">
          <Input id="title" name="title" required defaultValue={plan?.title ?? ""} />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field label="Objetivo" htmlFor="objective">
          <Input
            id="objective"
            name="objective"
            required
            defaultValue={plan?.objective ?? ""}
          />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field label="Descrição" htmlFor="description">
          <Textarea
            id="description"
            name="description"
            defaultValue={plan?.description ?? ""}
          />
        </Field>
      </div>

      <Field label="Início" htmlFor="startDate">
        <Input
          id="startDate"
          name="startDate"
          type="date"
          required
          defaultValue={toDateInputValue(plan?.startDate ?? new Date())}
        />
      </Field>

      <Field label="Prazo" htmlFor="dueDate">
        <Input
          id="dueDate"
          name="dueDate"
          type="date"
          required
          defaultValue={toDateInputValue(plan?.dueDate ?? new Date())}
        />
      </Field>

      <Field label="Prioridade" htmlFor="priority">
        <Select id="priority" name="priority" defaultValue={plan?.priority ?? "MEDIA"}>
          <option value="BAIXA">Baixa</option>
          <option value="MEDIA">Média</option>
          <option value="ALTA">Alta</option>
          <option value="URGENTE">Urgente</option>
        </Select>
      </Field>

      <Field label="Status" htmlFor="status">
        <Select id="status" name="status" defaultValue={plan?.status ?? "NAO_INICIADO"}>
          <option value="NAO_INICIADO">Não iniciado</option>
          <option value="EM_ANDAMENTO">Em andamento</option>
          <option value="CONCLUIDO">Concluído</option>
          <option value="ATRASADO">Atrasado</option>
          <option value="PAUSADO">Pausado</option>
        </Select>
      </Field>

      <div className="sm:col-span-2">
        <Field label="Observações do gestor" htmlFor="notes">
          <Textarea id="notes" name="notes" defaultValue={plan?.notes ?? ""} />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <SubmitButton>{plan ? "Salvar plano" : "Criar plano"}</SubmitButton>
      </div>
    </form>
  );
}
