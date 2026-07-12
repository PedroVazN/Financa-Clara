"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { markFixedCostPaid, deleteFixedCost } from "@/actions/fixed-costs";
import { Button } from "@/components/ui-legacy/button";
import { ConfirmDeleteButton } from "@/components/ui-legacy/confirm-delete";

export function FixedCostActions({
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
      <Link href={`/cliente/custos-fixos/${id}`}>
        <Button variant="outline">Editar</Button>
      </Link>
      {status !== "PAGO" ? (
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            startTransition(async () => {
              await markFixedCostPaid(id);
              router.refresh();
            })
          }
        >
          Marcar como pago
        </Button>
      ) : null}
      <ConfirmDeleteButton
        onConfirm={async () => {
          await deleteFixedCost(id);
          router.refresh();
        }}
      />
    </div>
  );
}
