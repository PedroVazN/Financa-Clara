"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getClientContext } from "@/lib/session";
import { writeAuditLog } from "@/lib/audit";
import { awardPoints, unlockAchievement, POINT_REWARDS } from "@/lib/gamification";
import {
  ApprovalStatus,
  ContactChannel,
  DebtPriority,
  FinancialStatus,
  Recurrence,
  RenegotiationStatus,
} from "@prisma/client";
import { addDays } from "date-fns";
import { z } from "zod";

const debtSchema = z.object({
  name: z.string().min(2),
  creditor: z.string().min(2),
  category: z.string().min(1),
  originalAmount: z.coerce.number().positive(),
  openBalance: z.coerce.number().min(0),
  contractedAt: z.string(),
  dueDate: z.string(),
  installmentCount: z.coerce.number().optional(),
  installmentValue: z.coerce.number().optional(),
  frequency: z.nativeEnum(Recurrence),
  financialStatus: z.nativeEnum(FinancialStatus),
  approvalStatus: z.nativeEnum(ApprovalStatus),
  priority: z.nativeEnum(DebtPriority),
  notes: z.string().optional(),
});

const renegSchema = z.object({
  renegotiatedAt: z.string(),
  agreementDesc: z.string().min(3),
  totalAmount: z.coerce.number().positive(),
  downPayment: z.coerce.number().optional(),
  paymentAmount: z.coerce.number().positive(),
  paymentCount: z.coerce.number().int().positive(),
  frequency: z.enum([Recurrence.SEMANAL, Recurrence.MENSAL]),
  firstPaymentDate: z.string(),
  attendantName: z.string().optional(),
  channel: z.nativeEnum(ContactChannel),
  protocolNumber: z.string().optional(),
  status: z.nativeEnum(RenegotiationStatus),
  notes: z.string().optional(),
  attachmentUrl: z.string().optional(),
});

function obj(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function createDebt(formData: FormData) {
  const { clientId, userId } = await getClientContext();
  const parsed = debtSchema.safeParse(obj(formData));
  if (!parsed.success) return { error: "Verifique os campos e tente novamente." };
  const data = parsed.data;

  const debt = await prisma.debt.create({
    data: {
      clientId,
      name: data.name,
      creditor: data.creditor,
      category: data.category,
      originalAmount: data.originalAmount,
      openBalance: data.openBalance,
      contractedAt: new Date(data.contractedAt),
      dueDate: new Date(data.dueDate),
      installmentCount: data.installmentCount || null,
      installmentValue: data.installmentValue || null,
      frequency: data.frequency,
      financialStatus: data.financialStatus,
      approvalStatus: data.approvalStatus,
      priority: data.priority,
      notes: data.notes || null,
    },
  });

  await writeAuditLog({
    userId,
    entityType: "Debt",
    entityId: debt.id,
    action: "CREATE",
    newData: debt,
  });

  revalidatePath("/cliente/dividas");
  revalidatePath("/cliente");
  return { success: true, id: debt.id };
}

export async function updateDebt(id: string, formData: FormData) {
  const { clientId, userId } = await getClientContext();
  const existing = await prisma.debt.findFirst({
    where: { id, clientId, deletedAt: null },
  });
  if (!existing) return { error: "Dívida não encontrada." };

  const parsed = debtSchema.safeParse(obj(formData));
  if (!parsed.success) return { error: "Verifique os campos e tente novamente." };
  const data = parsed.data;

  const debt = await prisma.debt.update({
    where: { id },
    data: {
      name: data.name,
      creditor: data.creditor,
      category: data.category,
      originalAmount: data.originalAmount,
      openBalance: data.openBalance,
      contractedAt: new Date(data.contractedAt),
      dueDate: new Date(data.dueDate),
      installmentCount: data.installmentCount || null,
      installmentValue: data.installmentValue || null,
      frequency: data.frequency,
      financialStatus: data.financialStatus,
      approvalStatus: data.approvalStatus,
      priority: data.priority,
      notes: data.notes || null,
    },
  });

  await writeAuditLog({
    userId,
    entityType: "Debt",
    entityId: id,
    action: "UPDATE",
    previousData: existing,
    newData: debt,
  });

  if (existing.financialStatus !== data.financialStatus) {
    await awardPoints(
      clientId,
      POINT_REWARDS.UPDATE_DEBT,
      "Atualizou status da dívida",
      `debt-status-${id}-${data.financialStatus}`,
    );
  }

  revalidatePath("/cliente/dividas");
  revalidatePath(`/cliente/dividas/${id}`);
  revalidatePath("/cliente");
  return { success: true };
}

export async function deleteDebt(id: string) {
  const { clientId, userId } = await getClientContext();
  const existing = await prisma.debt.findFirst({
    where: { id, clientId, deletedAt: null },
  });
  if (!existing) return { error: "Dívida não encontrada." };

  await prisma.debt.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await writeAuditLog({
    userId,
    entityType: "Debt",
    entityId: id,
    action: "DELETE",
    previousData: existing,
  });

  revalidatePath("/cliente/dividas");
  revalidatePath("/cliente");
  return { success: true };
}

export async function createRenegotiation(debtId: string, formData: FormData) {
  const { clientId, userId } = await getClientContext();
  const debt = await prisma.debt.findFirst({
    where: { id: debtId, clientId, deletedAt: null },
  });
  if (!debt) return { error: "Dívida não encontrada." };

  const parsed = renegSchema.safeParse(obj(formData));
  if (!parsed.success) return { error: "Verifique os campos e tente novamente." };
  const data = parsed.data;

  const renegotiation = await prisma.debtRenegotiation.create({
    data: {
      debtId,
      renegotiatedAt: new Date(data.renegotiatedAt),
      agreementDesc: data.agreementDesc,
      totalAmount: data.totalAmount,
      downPayment: data.downPayment || null,
      paymentAmount: data.paymentAmount,
      paymentCount: data.paymentCount,
      frequency: data.frequency,
      firstPaymentDate: new Date(data.firstPaymentDate),
      attendantName: data.attendantName || null,
      channel: data.channel,
      protocolNumber: data.protocolNumber || null,
      status: data.status,
      notes: data.notes || null,
      attachmentUrl: data.attachmentUrl || null,
    },
  });

  const dayStep = data.frequency === "SEMANAL" ? 7 : 30;
  await prisma.renegotiationPayment.createMany({
    data: Array.from({ length: data.paymentCount }).map((_, i) => ({
      renegotiationId: renegotiation.id,
      dueDate: addDays(new Date(data.firstPaymentDate), i * dayStep),
      amount: data.paymentAmount,
      financialStatus: "PENDENTE" as const,
    })),
  });

  await prisma.debt.update({
    where: { id: debtId },
    data: { financialStatus: "RENEGOCIADO" },
  });

  await writeAuditLog({
    userId,
    entityType: "DebtRenegotiation",
    entityId: renegotiation.id,
    action: "CREATE",
    newData: renegotiation,
  });
  await awardPoints(
    clientId,
    POINT_REWARDS.REGISTER_RENEGOTIATION,
    "Registrou uma renegociação",
    `reneg-${renegotiation.id}`,
  );
  await unlockAchievement(clientId, "FIRST_RENEG");

  revalidatePath(`/cliente/dividas/${debtId}`);
  revalidatePath("/cliente/dividas");
  revalidatePath("/cliente");
  return { success: true };
}

export async function deleteRenegotiation(id: string, debtId: string) {
  const { clientId, userId } = await getClientContext();
  const debt = await prisma.debt.findFirst({
    where: { id: debtId, clientId, deletedAt: null },
  });
  if (!debt) return { error: "Dívida não encontrada." };

  const existing = await prisma.debtRenegotiation.findFirst({
    where: { id, debtId, deletedAt: null },
  });
  if (!existing) return { error: "Renegociação não encontrada." };

  await prisma.debtRenegotiation.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await writeAuditLog({
    userId,
    entityType: "DebtRenegotiation",
    entityId: id,
    action: "DELETE",
    previousData: existing,
  });

  revalidatePath(`/cliente/dividas/${debtId}`);
  return { success: true };
}

export async function markRenegotiationPaymentPaid(paymentId: string, debtId: string) {
  const { clientId, userId } = await getClientContext();
  const debt = await prisma.debt.findFirst({
    where: { id: debtId, clientId, deletedAt: null },
  });
  if (!debt) return { error: "Dívida não encontrada." };

  const payment = await prisma.renegotiationPayment.findUnique({
    where: { id: paymentId },
    include: { renegotiation: true },
  });
  if (!payment || payment.renegotiation.debtId !== debtId) {
    return { error: "Pagamento não encontrado." };
  }

  await prisma.renegotiationPayment.update({
    where: { id: paymentId },
    data: { financialStatus: "PAGO", paidAt: new Date() },
  });
  await writeAuditLog({
    userId,
    entityType: "RenegotiationPayment",
    entityId: paymentId,
    action: "STATUS_CHANGE",
    previousData: { financialStatus: payment.financialStatus },
    newData: { financialStatus: "PAGO" },
  });
  await awardPoints(
    clientId,
    POINT_REWARDS.MARK_PAID,
    "Marcou pagamento da renegociação como concluído",
    `reneg-pay-${paymentId}`,
  );

  revalidatePath(`/cliente/dividas/${debtId}`);
  return { success: true };
}
