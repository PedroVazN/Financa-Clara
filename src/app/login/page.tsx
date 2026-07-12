"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, Suspense } from "react";
import { motion } from "motion/react";
import { Field, Input } from "@/components/ui-legacy/field";
import { Button } from "@/components/ui-legacy/button";
import { Alert } from "@/components/ui-legacy/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { loginAction } from "@/actions/auth";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setError(null);
        startTransition(async () => {
          const result = await loginAction(formData);
          if (result?.error) {
            setError(result.error);
            return;
          }
          router.push(result.redirectTo || params.get("callbackUrl") || "/cliente");
          router.refresh();
        });
      }}
    >
      {error ? <Alert variant="error">{error}</Alert> : null}
      <Field label="E-mail" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="seu@email.com"
        />
      </Field>
      <Field label="Senha" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="Sua senha"
        />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Entrando..." : "Entrar"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/recuperar-senha" className="font-medium text-primary underline underline-offset-4">
          Esqueci minha senha
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="clareira-glow relative w-full max-w-md"
      >
        <div className="mb-8 text-center sm:text-left">
          <p className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl dark:text-foreground">
            Finança Clara
          </p>
          <p className="mt-3 max-w-sm text-base text-muted-foreground sm:text-lg">
            Organize sua vida financeira com calma — e um plano feito com você.
          </p>
        </div>

        <div className="glass-strong rounded-[1.5rem] p-7 sm:p-8">
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Entrar
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use sua conta para continuar de onde parou.
          </p>

          <div className="mt-6">
            <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando...</p>}>
              <LoginForm />
            </Suspense>
          </div>

          <div className="mt-7 rounded-2xl border border-border/70 bg-secondary/70 px-4 py-3 text-sm text-foreground dark:bg-secondary dark:text-secondary-foreground">
            <p className="font-medium">Contas de demonstração</p>
            <p className="mt-1 text-muted-foreground">Cliente: cliente@demo.com / 123456</p>
            <p className="text-muted-foreground">Gestor: gestor@demo.com / 123456</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
