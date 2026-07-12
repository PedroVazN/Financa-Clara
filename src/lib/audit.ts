import { prisma } from "@/lib/prisma";

export async function writeAuditLog(params: {
  userId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  previousData?: unknown;
  newData?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId ?? null,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      previousData: params.previousData
        ? JSON.stringify(params.previousData)
        : null,
      newData: params.newData ? JSON.stringify(params.newData) : null,
    },
  });
}
