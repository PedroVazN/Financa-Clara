import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/app-shell";
import { redirect } from "next/navigation";

export default async function GestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "MANAGER") redirect("/login");

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, readAt: null },
  });

  return (
    <AppShell
      role="MANAGER"
      userName={session.user.name}
      unreadCount={unreadCount}
    >
      {children}
    </AppShell>
  );
}
