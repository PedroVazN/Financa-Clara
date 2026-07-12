"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui-legacy/button";

export function ConfirmDeleteButton({
  onConfirm,
  label = "Excluir",
}: {
  onConfirm: () => Promise<void> | void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button type="button" variant="danger" onClick={() => setOpen(true)}>
        {label}
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3">
      <p className="text-sm text-rose-900">Confirmar exclusão?</p>
      <Button
        type="button"
        variant="danger"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await onConfirm();
            setOpen(false);
          })
        }
      >
        {pending ? "Excluindo..." : "Sim, excluir"}
      </Button>
      <Button type="button" variant="outline" onClick={() => setOpen(false)}>
        Cancelar
      </Button>
    </div>
  );
}
