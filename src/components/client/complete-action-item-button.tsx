"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { completeActionItem } from "@/actions/action-plans";
import { Button } from "@/components/ui-legacy/button";

export function CompleteActionItemButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await completeActionItem(itemId);
          router.refresh();
        })
      }
    >
      {pending ? "Concluindo..." : "Concluir ação"}
    </Button>
  );
}
