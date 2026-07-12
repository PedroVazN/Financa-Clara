"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui-legacy/button";
import { ConfirmDeleteButton } from "@/components/ui-legacy/confirm-delete";
import {
  deleteIncome,
  duplicateIncome,
  markIncomeReceived,
} from "@/actions/incomes";

export function IncomeActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/cliente/entradas/${id}`}>
        <Button variant="outline">Editar</Button>
      </Link>
      {status !== "RECEBIDO" ? (
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            startTransition(async () => {
              await markIncomeReceived(id);
              router.refresh();
            })
          }
        >
          Marcar como recebida
        </Button>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        onClick={() =>
          startTransition(async () => {
            await duplicateIncome(id);
            router.refresh();
          })
        }
      >
        Duplicar
      </Button>
      <ConfirmDeleteButton
        onConfirm={async () => {
          await deleteIncome(id);
          router.refresh();
        }}
      />
    </div>
  );
}
