"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Field, Input } from "@/components/ui-legacy/field";
import { Button } from "@/components/ui-legacy/button";
import { Alert } from "@/components/ui-legacy/card";
import { requestPasswordReset } from "@/actions/auth";

export default function RecuperarSenhaPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_30%,#a7f3d0_0%,transparent_40%),linear-gradient(160deg,#f8fafc,#e0f2fe)]"
        aria-hidden
      />
      <div className="relative w-full max-w-md rounded-3xl border border-white/70 bg-card p-8 shadow-xl backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          Finança Clara
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
          Recuperar senha
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Informe seu e-mail. Se ele estiver cadastrado, você receberá orientações.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            startTransition(async () => {
              const result = await requestPasswordReset(formData);
              setMessage(result.message);
            });
          }}
        >
          {message ? <Alert variant="info">{message}</Alert> : null}
          <Field label="E-mail" htmlFor="email">
            <Input id="email" name="email" type="email" required />
          </Field>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Enviando..." : "Enviar instruções"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="font-medium text-primary underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
}
