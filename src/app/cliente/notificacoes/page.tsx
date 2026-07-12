import Link from "next/link";
import {
  MarkAllNotificationsReadButton,
  MarkNotificationReadButton,
} from "@/components/client/notification-actions";
import { Button } from "@/components/ui-legacy/button";
import { Card, EmptyState, PageHeader } from "@/components/ui-legacy/card";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getClientContext } from "@/lib/session";

export default async function NotificacoesPage() {
  const { userId } = await getClientContext();
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  return (
    <div>
      <PageHeader
        title="Notificações"
        description="Acompanhe avisos do seu plano, pontos e conquistas."
        actions={unreadCount > 0 ? <MarkAllNotificationsReadButton /> : undefined}
      />

      {notifications.length === 0 ? (
        <EmptyState
          title="Nenhuma notificação por enquanto"
          description="Quando houver novidades importantes, elas aparecerão aqui."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const content = (
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-foreground">{notification.title}</h2>
                  {!notification.readAt ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-950 dark:bg-amber-950 dark:text-amber-200">
                      Nova
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatDateTime(notification.createdAt)}
                </p>
              </div>
            );

            return (
              <Card
                key={notification.id}
                className={
                  notification.readAt
                    ? "space-y-3"
                    : "space-y-3 border-border bg-accent/50"
                }
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {notification.href ? (
                    <Link href={notification.href} className="block flex-1">
                      {content}
                    </Link>
                  ) : (
                    <div className="flex-1">{content}</div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {notification.href ? (
                      <Link href={notification.href}>
                        <Button variant="outline">Abrir</Button>
                      </Link>
                    ) : null}
                    {!notification.readAt ? (
                      <MarkNotificationReadButton id={notification.id} />
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
