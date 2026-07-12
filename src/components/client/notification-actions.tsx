"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { markAllNotificationsRead, markNotificationRead } from "@/actions/auth";
import { Button } from "@/components/ui-legacy/button";

export function MarkNotificationReadButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await markNotificationRead(id);
          router.refresh();
        })
      }
    >
      {pending ? "Marcando..." : "Marcar como lida"}
    </Button>
  );
}

export function MarkAllNotificationsReadButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await markAllNotificationsRead();
          router.refresh();
        })
      }
    >
      {pending ? "Atualizando..." : "Marcar todas como lidas"}
    </Button>
  );
}
