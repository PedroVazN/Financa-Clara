"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getClientContext } from "@/lib/session";
import { writeAuditLog } from "@/lib/audit";
import { awardPoints, unlockAchievement, POINT_REWARDS } from "@/lib/gamification";
import { ApprovalStatus, FinancialStatus, Recurrence } from "@prisma/client";
import { z } from "zod";

const schema = z.object({
  description: z.string().min(2),
  category: z.string().min(1),
  amount: z.coerce.number().positive(),
  date: z.string(),
  paymentMethod: z.string().optional(),
  recurrence: z.nativeEnum(Recurrence),
  financialStatus: z.nativeEnum(FinancialStatus),
  approvalStatus: z.nativeEnum(ApprovalStatus),
  notes: z.string().optional(),
});

function obj(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function createExpense(formData: FormData) {
  const { clientId, userId } = await getClientContext();
  const parsed = schema.safeParse(obj(formData));
  if (!parsed.success) return { error: "Verifique os campos e tente novamente." };
  const data = parsed.data;

  const item = await prisma.expense.create({
    data: {
      clientId,
      description: data.description,
      category: data.category,
      amount: data.amount,
      date: new Date(data.date),
      paymentMethod: data.paymentMethod || null,
      recurrence: data.recurrence,
      financialStatus: data.financialStatus,
      approvalStatus: data.approvalStatus,
      notes: data.notes || null,
    },
  });

  await writeAuditLog({
    userId,
    entityType: "Expense",
    entityId: item.id,
    action: "CREATE",
    newData: item,
  });

  revalidatePath("/cliente/saidas");
  revalidatePath("/cliente");
  return { success: true };
}

export async function updateExpense(id: string, formData: FormData) {
  const { clientId, userId } = await getClientContext();
  const existing = await prisma.expense.findFirst({
    where: { id, clientId, deletedAt: null },
  });
  if (!existing) return { error: "Saída não encontrada." };

  const parsed = schema.safeParse(obj(formData));
  if (!parsed.success) return { error: "Verifique os campos e tente novamente." };
  const data = parsed.data;

  const item = await prisma.expense.update({
    where: { id },
    data: {
      description: data.description,
      category: data.category,
      amount: data.amount,
      date: new Date(data.date),
      paymentMethod: data.paymentMethod || null,
      recurrence: data.recurrence,
      financialStatus: data.financialStatus,
      approvalStatus: data.approvalStatus,
      notes: data.notes || null,
    },
  });

  await writeAuditLog({
    userId,
    entityType: "Expense",
    entityId: id,
    action: "UPDATE",
    previousData: existing,
    newData: item,
  });

  if (data.financialStatus === "PAGO" && existing.financialStatus !== "PAGO") {
    await awardPoints(
      clientId,
      POINT_REWARDS.MARK_PAID,
      "Marcou saída como paga",
      `expense-paid-${id}`,
    );
    await unlockAchievement(clientId, "FIRST_PAID");
  }

  revalidatePath("/cliente/saidas");
  revalidatePath("/cliente");
  return { success: true };
}

export async function deleteExpense(id: string) {
  const { clientId, userId } = await getClientContext();
  const existing = await prisma.expense.findFirst({
    where: { id, clientId, deletedAt: null },
  });
  if (!existing) return { error: "Saída não encontrada." };

  await prisma.expense.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await writeAuditLog({
    userId,
    entityType: "Expense",
    entityId: id,
    action: "DELETE",
    previousData: existing,
  });

  revalidatePath("/cliente/saidas");
  revalidatePath("/cliente");
  return { success: true };
}
