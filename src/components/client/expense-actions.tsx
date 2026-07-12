"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui-legacy/button";
import { ConfirmDeleteButton } from "@/components/ui-legacy/confirm-delete";
import { deleteExpense } from "@/actions/expenses";

export function ExpenseActions({ id }: { id: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/cliente/saidas/${id}`}>
        <Button variant="outline">Editar</Button>
      </Link>
      <ConfirmDeleteButton
        onConfirm={async () => {
          await deleteExpense(id);
          router.refresh();
        }}
      />
    </div>
  );
}
