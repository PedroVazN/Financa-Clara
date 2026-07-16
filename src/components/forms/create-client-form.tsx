"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert } from "@/components/ui-legacy/card";
import { Field, Input } from "@/components/ui-legacy/field";
import { SubmitButton } from "@/components/ui-legacy/submit-button";

type ActionResult = {
  error?: string;
  success?: boolean;
};

export function CreateClientForm({
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
          router.push("/gestor/clientes");
          router.refresh();
        });
      }}
    >
      {error ? (
        <div className="sm:col-span-2">
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}

      <Field label="Nome completo" htmlFor="name">
        <Input id="name" name="name" required placeholder="Nome do cliente" />
      </Field>
      <Field label="E-mail de login" htmlFor="email">
        <Input id="email" name="email" type="email" required placeholder="cliente@email.com" />
      </Field>
      <Field label="Senha inicial" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="Mínimo 6 caracteres"
        />
      </Field>
      <Field label="Telefone" htmlFor="phone">
        <Input id="phone" name="phone" placeholder="(11) 99999-0000" />
      </Field>
      <Field label="Cidade" htmlFor="city">
        <Input id="city" name="city" placeholder="São Paulo" />
      </Field>

      <div className="sm:col-span-2">
        <SubmitButton>Criar login do cliente</SubmitButton>
      </div>
    </form>
  );
}
