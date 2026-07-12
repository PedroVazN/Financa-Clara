import Link from "next/link";
import { Bell } from "lucide-react";
import { getManagerContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui-legacy/button";
import { Card, EmptyState, PageHeader } from "@/components/ui-legacy/card";

export default async function GestorNotificacoesPage() {
  const { userId } = await getManagerContext();
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <PageHeader
        title="Notificações"
        description="Alertas sobre ações concluídas, validações e movimentações dos seus clientes."
      />

      {notifications.length === 0 ? (
        <EmptyState title="Nenhuma notificação" description="Quando houver novidades dos clientes, elas aparecerão aqui." />
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {notifications.map((notification) => (
              <li key={notification.id} className="py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <div className="mt-1 rounded-xl bg-accent p-2 text-primary">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{notification.title}</p>
                        {notification.readAt ? (
                          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                            Lida
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900">
                            Nova
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(notification.createdAt)}</p>
                    </div>
                  </div>
                  {notification.href ? (
                    <Link href={notification.href}>
                      <Button variant="outline">Abrir</Button>
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
