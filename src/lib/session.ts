import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireRole(role: UserRole) {
  const session = await requireSession();
  if (session.user.role !== role) {
    redirect(session.user.role === "CLIENT" ? "/cliente" : "/gestor");
  }
  return session;
}

export async function getClientContext() {
  const session = await requireRole("CLIENT");
  const clientId = session.user.clientProfileId;
  if (!clientId) redirect("/login");
  return { session, clientId, userId: session.user.id };
}

export async function getManagerContext() {
  const session = await requireRole("MANAGER");
  const managerId = session.user.managerProfileId;
  if (!managerId) redirect("/login");
  return { session, managerId, userId: session.user.id };
}

export async function assertManagerOwnsClient(managerId: string, clientId: string) {
  const link = await prisma.managerClientRelationship.findUnique({
    where: {
      managerId_clientId: { managerId, clientId },
    },
  });
  if (!link) {
    throw new Error("Você não tem permissão para acessar este cliente.");
  }
  return link;
}
