"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { completeActionItem } from "@/actions/action-plans";
import { Button } from "@/components/ui-legacy/button";

export function CompleteActionButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await completeActionItem(itemId);
            if (result?.error) {
              setError(result.error);
              return;
            }
            router.refresh();
          })
        }
      >
        Marcar como concluída
      </Button>
      {error ? <p className="text-xs font-medium text-rose-700">{error}</p> : null}
    </div>
  );
}
