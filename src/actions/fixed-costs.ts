"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getClientContext } from "@/lib/session";
import { writeAuditLog } from "@/lib/audit";
import { awardPoints, unlockAchievement, POINT_REWARDS } from "@/lib/gamification";
import { ApprovalStatus, FinancialStatus, Recurrence } from "@prisma/client";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  category: z.string().min(1),
  amount: z.coerce.number().positive(),
  frequency: z.enum([Recurrence.MENSAL, Recurrence.ANUAL]),
  dueDay: z.coerce.number().int().min(1).max(31),
  nextDueDate: z.string(),
  paymentMethod: z.string().optional(),
  financialStatus: z.nativeEnum(FinancialStatus),
  approvalStatus: z.nativeEnum(ApprovalStatus),
  notes: z.string().optional(),
  receiptUrl: z.string().optional(),
});

function obj(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function createFixedCost(formData: FormData) {
  const { clientId, userId } = await getClientContext();
  const parsed = schema.safeParse(obj(formData));
  if (!parsed.success) return { error: "Verifique os campos e tente novamente." };
  const data = parsed.data;

  const item = await prisma.fixedCost.create({
    data: {
      clientId,
      name: data.name,
      category: data.category,
      amount: data.amount,
      frequency: data.frequency,
      dueDay: data.dueDay,
      nextDueDate: new Date(data.nextDueDate),
      paymentMethod: data.paymentMethod || null,
      financialStatus: data.financialStatus,
      approvalStatus: data.approvalStatus,
      notes: data.notes || null,
      receiptUrl: data.receiptUrl || null,
    },
  });

  await writeAuditLog({
    userId,
    entityType: "FixedCost",
    entityId: item.id,
    action: "CREATE",
    newData: item,
  });
  await unlockAchievement(clientId, "FIRST_REGISTER");

  revalidatePath("/cliente/custos-fixos");
  revalidatePath("/cliente");
  return { success: true };
}

export async function updateFixedCost(id: string, formData: FormData) {
  const { clientId, userId } = await getClientContext();
  const existing = await prisma.fixedCost.findFirst({
    where: { id, clientId, deletedAt: null },
  });
  if (!existing) return { error: "Custo fixo não encontrado." };

  const parsed = schema.safeParse(obj(formData));
  if (!parsed.success) return { error: "Verifique os campos e tente novamente." };
  const data = parsed.data;

  const item = await prisma.fixedCost.update({
    where: { id },
    data: {
      name: data.name,
      category: data.category,
      amount: data.amount,
      frequency: data.frequency,
      dueDay: data.dueDay,
      nextDueDate: new Date(data.nextDueDate),
      paymentMethod: data.paymentMethod || null,
      financialStatus: data.financialStatus,
      approvalStatus: data.approvalStatus,
      notes: data.notes || null,
      receiptUrl: data.receiptUrl || null,
    },
  });

  await writeAuditLog({
    userId,
    entityType: "FixedCost",
    entityId: id,
    action: "UPDATE",
    previousData: existing,
    newData: item,
  });

  if (data.financialStatus === "PAGO" && existing.financialStatus !== "PAGO") {
    await awardPoints(
      clientId,
      POINT_REWARDS.MARK_PAID,
      "Marcou custo fixo como pago",
      `fixed-paid-${id}`,
    );
    await unlockAchievement(clientId, "FIRST_PAID");
  }

  revalidatePath("/cliente/custos-fixos");
  revalidatePath("/cliente");
  return { success: true };
}

export async function deleteFixedCost(id: string) {
  const { clientId, userId } = await getClientContext();
  const existing = await prisma.fixedCost.findFirst({
    where: { id, clientId, deletedAt: null },
  });
  if (!existing) return { error: "Custo fixo não encontrado." };

  await prisma.fixedCost.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await writeAuditLog({
    userId,
    entityType: "FixedCost",
    entityId: id,
    action: "DELETE",
    previousData: existing,
  });

  revalidatePath("/cliente/custos-fixos");
  revalidatePath("/cliente");
  return { success: true };
}

export async function markFixedCostPaid(id: string) {
  const { clientId, userId } = await getClientContext();
  const existing = await prisma.fixedCost.findFirst({
    where: { id, clientId, deletedAt: null },
  });
  if (!existing) return { error: "Custo fixo não encontrado." };

  await prisma.fixedCost.update({
    where: { id },
    data: { financialStatus: "PAGO" },
  });
  await writeAuditLog({
    userId,
    entityType: "FixedCost",
    entityId: id,
    action: "STATUS_CHANGE",
    previousData: { financialStatus: existing.financialStatus },
    newData: { financialStatus: "PAGO" },
  });
  await awardPoints(
    clientId,
    POINT_REWARDS.MARK_PAID,
    "Marcou custo fixo como pago",
    `fixed-paid-${id}`,
  );
  await unlockAchievement(clientId, "FIRST_PAID");

  revalidatePath("/cliente/custos-fixos");
  revalidatePath("/cliente");
  return { success: true };
}
