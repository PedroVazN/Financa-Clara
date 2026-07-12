"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getClientContext } from "@/lib/session";
import { writeAuditLog } from "@/lib/audit";
import { awardPoints, unlockAchievement, POINT_REWARDS } from "@/lib/gamification";
import {
  ApprovalStatus,
  FinancialStatus,
  IncomeType,
  Recurrence,
} from "@prisma/client";
import { z } from "zod";

const incomeSchema = z.object({
  description: z.string().min(2),
  category: z.string().min(1),
  amount: z.coerce.number().positive(),
  receivedAt: z.string(),
  incomeType: z.nativeEnum(IncomeType),
  recurrence: z.nativeEnum(Recurrence),
  recurrenceStart: z.string().optional(),
  recurrenceEnd: z.string().optional(),
  financialStatus: z.nativeEnum(FinancialStatus),
  approvalStatus: z.nativeEnum(ApprovalStatus),
  notes: z.string().optional(),
});

function formDataToObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function createIncome(formData: FormData) {
  const { clientId, userId } = await getClientContext();
  const parsed = incomeSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { error: "Verifique os campos e tente novamente." };

  const data = parsed.data;
  const income = await prisma.income.create({
    data: {
      clientId,
      description: data.description,
      category: data.category,
      amount: data.amount,
      receivedAt: new Date(data.receivedAt),
      incomeType: data.incomeType,
      recurrence: data.recurrence,
      recurrenceStart: data.recurrenceStart
        ? new Date(data.recurrenceStart)
        : null,
      recurrenceEnd: data.recurrenceEnd ? new Date(data.recurrenceEnd) : null,
      financialStatus: data.financialStatus,
      approvalStatus: data.approvalStatus,
      notes: data.notes || null,
    },
  });

  await writeAuditLog({
    userId,
    entityType: "Income",
    entityId: income.id,
    action: "CREATE",
    newData: income,
  });
  await awardPoints(
    clientId,
    POINT_REWARDS.CREATE_INCOME,
    "Cadastrou uma entrada",
    `income-create-${income.id}`,
  );
  await unlockAchievement(clientId, "FIRST_REGISTER");

  revalidatePath("/cliente/entradas");
  revalidatePath("/cliente");
  return { success: true };
}

export async function updateIncome(id: string, formData: FormData) {
  const { clientId, userId } = await getClientContext();
  const existing = await prisma.income.findFirst({
    where: { id, clientId, deletedAt: null },
  });
  if (!existing) return { error: "Entrada não encontrada." };

  const parsed = incomeSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { error: "Verifique os campos e tente novamente." };
  const data = parsed.data;

  const income = await prisma.income.update({
    where: { id },
    data: {
      description: data.description,
      category: data.category,
      amount: data.amount,
      receivedAt: new Date(data.receivedAt),
      incomeType: data.incomeType,
      recurrence: data.recurrence,
      recurrenceStart: data.recurrenceStart
        ? new Date(data.recurrenceStart)
        : null,
      recurrenceEnd: data.recurrenceEnd ? new Date(data.recurrenceEnd) : null,
      financialStatus: data.financialStatus,
      approvalStatus: data.approvalStatus,
      notes: data.notes || null,
    },
  });

  await writeAuditLog({
    userId,
    entityType: "Income",
    entityId: id,
    action: "UPDATE",
    previousData: existing,
    newData: income,
  });

  if (
    existing.financialStatus === "PENDENTE" &&
    data.financialStatus !== "PENDENTE"
  ) {
    await awardPoints(
      clientId,
      POINT_REWARDS.UPDATE_PENDING,
      "Atualizou uma pendência",
      `income-pending-${id}-${data.financialStatus}`,
    );
  }

  if (data.financialStatus === "RECEBIDO") {
    await awardPoints(
      clientId,
      POINT_REWARDS.MARK_PAID,
      "Marcou entrada como recebida",
      `income-received-${id}`,
    );
  }

  revalidatePath("/cliente/entradas");
  revalidatePath("/cliente");
  return { success: true };
}

export async function deleteIncome(id: string) {
  const { clientId, userId } = await getClientContext();
  const existing = await prisma.income.findFirst({
    where: { id, clientId, deletedAt: null },
  });
  if (!existing) return { error: "Entrada não encontrada." };

  await prisma.income.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await writeAuditLog({
    userId,
    entityType: "Income",
    entityId: id,
    action: "DELETE",
    previousData: existing,
  });

  revalidatePath("/cliente/entradas");
  revalidatePath("/cliente");
  return { success: true };
}

export async function duplicateIncome(id: string) {
  const { clientId, userId } = await getClientContext();
  const existing = await prisma.income.findFirst({
    where: { id, clientId, deletedAt: null },
  });
  if (!existing) return { error: "Entrada não encontrada." };

  const copy = await prisma.income.create({
    data: {
      clientId,
      description: `${existing.description} (cópia)`,
      category: existing.category,
      amount: existing.amount,
      receivedAt: existing.receivedAt,
      incomeType: existing.incomeType,
      recurrence: existing.recurrence,
      recurrenceStart: existing.recurrenceStart,
      recurrenceEnd: existing.recurrenceEnd,
      financialStatus: "PENDENTE",
      approvalStatus: "AGUARDANDO_APROVACAO",
      notes: existing.notes,
    },
  });

  await writeAuditLog({
    userId,
    entityType: "Income",
    entityId: copy.id,
    action: "DUPLICATE",
    newData: copy,
  });

  revalidatePath("/cliente/entradas");
  return { success: true };
}

export async function markIncomeReceived(id: string) {
  const { clientId, userId } = await getClientContext();
  const existing = await prisma.income.findFirst({
    where: { id, clientId, deletedAt: null },
  });
  if (!existing) return { error: "Entrada não encontrada." };

  const income = await prisma.income.update({
    where: { id },
    data: { financialStatus: "RECEBIDO" },
  });

  await writeAuditLog({
    userId,
    entityType: "Income",
    entityId: id,
    action: "STATUS_CHANGE",
    previousData: { financialStatus: existing.financialStatus },
    newData: { financialStatus: "RECEBIDO" },
  });
  await awardPoints(
    clientId,
    POINT_REWARDS.MARK_PAID,
    "Marcou entrada como recebida",
    `income-received-${id}`,
  );

  void income;
  revalidatePath("/cliente/entradas");
  revalidatePath("/cliente");
  return { success: true };
}
