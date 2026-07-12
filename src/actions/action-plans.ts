"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  assertManagerOwnsClient,
  getClientContext,
  getManagerContext,
} from "@/lib/session";
import { writeAuditLog } from "@/lib/audit";
import { awardPoints, unlockAchievement, POINT_REWARDS } from "@/lib/gamification";
import {
  ActionCategory,
  ActionItemStatus,
  DebtPriority,
  PlanStatus,
} from "@prisma/client";
import { isBefore } from "date-fns";
import { z } from "zod";

const planSchema = z.object({
  title: z.string().min(3),
  objective: z.string().min(3),
  description: z.string().optional(),
  startDate: z.string(),
  dueDate: z.string(),
  priority: z.nativeEnum(DebtPriority),
  status: z.nativeEnum(PlanStatus),
  notes: z.string().optional(),
});

const itemSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  category: z.nativeEnum(ActionCategory),
  relatedItemLabel: z.string().optional(),
  relatedAmount: z.coerce.number().optional(),
  dueDate: z.string(),
  priority: z.nativeEnum(DebtPriority),
  pointsAwarded: z.coerce.number().int().min(0).default(20),
  status: z.nativeEnum(ActionItemStatus).optional(),
  guidance: z.string().optional(),
});

function obj(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function createActionPlan(clientId: string, formData: FormData) {
  const { managerId, userId } = await getManagerContext();
  await assertManagerOwnsClient(managerId, clientId);

  const parsed = planSchema.safeParse(obj(formData));
  if (!parsed.success) return { error: "Verifique os campos e tente novamente." };
  const data = parsed.data;

  const plan = await prisma.actionPlan.create({
    data: {
      clientId,
      managerId,
      title: data.title,
      objective: data.objective,
      description: data.description || null,
      startDate: new Date(data.startDate),
      dueDate: new Date(data.dueDate),
      priority: data.priority,
      status: data.status,
      notes: data.notes || null,
    },
  });

  const client = await prisma.clientProfile.findUniqueOrThrow({
    where: { id: clientId },
  });
  await prisma.notification.create({
    data: {
      userId: client.userId,
      title: "Novo plano de ação",
      message: `Seu gestor criou o plano "${plan.title}". Vamos organizar o próximo passo juntos.`,
      type: "ACTION_PLAN",
      href: "/cliente/plano",
    },
  });

  await writeAuditLog({
    userId,
    entityType: "ActionPlan",
    entityId: plan.id,
    action: "CREATE",
    newData: plan,
  });

  revalidatePath("/gestor/planos");
  revalidatePath(`/gestor/clientes/${clientId}`);
  revalidatePath("/cliente/plano");
  return { success: true, id: plan.id };
}

export async function updateActionPlan(planId: string, formData: FormData) {
  const { managerId, userId } = await getManagerContext();
  const plan = await prisma.actionPlan.findFirst({
    where: { id: planId, managerId, deletedAt: null },
  });
  if (!plan) return { error: "Plano não encontrado." };

  const parsed = planSchema.safeParse(obj(formData));
  if (!parsed.success) return { error: "Verifique os campos e tente novamente." };
  const data = parsed.data;

  const updated = await prisma.actionPlan.update({
    where: { id: planId },
    data: {
      title: data.title,
      objective: data.objective,
      description: data.description || null,
      startDate: new Date(data.startDate),
      dueDate: new Date(data.dueDate),
      priority: data.priority,
      status: data.status,
      notes: data.notes || null,
    },
  });

  await writeAuditLog({
    userId,
    entityType: "ActionPlan",
    entityId: planId,
    action: "UPDATE",
    previousData: plan,
    newData: updated,
  });

  revalidatePath("/gestor/planos");
  revalidatePath(`/gestor/planos/${planId}`);
  revalidatePath(`/gestor/clientes/${plan.clientId}`);
  revalidatePath("/cliente/plano");
  return { success: true };
}

export async function addActionItem(planId: string, formData: FormData) {
  const { managerId, userId } = await getManagerContext();
  const plan = await prisma.actionPlan.findFirst({
    where: { id: planId, managerId, deletedAt: null },
  });
  if (!plan) return { error: "Plano não encontrado." };

  const parsed = itemSchema.safeParse(obj(formData));
  if (!parsed.success) return { error: "Verifique os campos e tente novamente." };
  const data = parsed.data;

  const item = await prisma.actionItem.create({
    data: {
      planId,
      title: data.title,
      description: data.description || null,
      category: data.category,
      relatedItemLabel: data.relatedItemLabel || null,
      relatedAmount: data.relatedAmount || null,
      dueDate: new Date(data.dueDate),
      priority: data.priority,
      pointsAwarded: data.pointsAwarded,
      status: data.status ?? "PENDENTE",
      guidance: data.guidance || null,
    },
  });

  const client = await prisma.clientProfile.findUniqueOrThrow({
    where: { id: plan.clientId },
  });
  await prisma.notification.create({
    data: {
      userId: client.userId,
      title: "Nova ação no plano",
      message: `Foi adicionada a ação: ${item.title}`,
      type: "ACTION_ITEM",
      href: "/cliente/plano",
    },
  });

  await writeAuditLog({
    userId,
    entityType: "ActionItem",
    entityId: item.id,
    action: "CREATE",
    newData: item,
  });

  revalidatePath(`/gestor/planos/${planId}`);
  revalidatePath("/cliente/plano");
  return { success: true };
}

export async function completeActionItem(itemId: string) {
  const { clientId, userId } = await getClientContext();
  const item = await prisma.actionItem.findFirst({
    where: { id: itemId, deletedAt: null, plan: { clientId, deletedAt: null } },
    include: { plan: true },
  });
  if (!item) return { error: "Ação não encontrada." };
  if (item.status === "CONCLUIDA") return { error: "Esta ação já foi concluída." };

  const onTime = !isBefore(new Date(), item.dueDate) || item.dueDate >= new Date();
  const actuallyOnTime = item.dueDate >= new Date() || item.dueDate.toDateString() === new Date().toDateString();

  const updated = await prisma.actionItem.update({
    where: { id: itemId },
    data: {
      status: "CONCLUIDA",
      completedAt: new Date(),
      completedByClient: true,
    },
  });

  await awardPoints(
    clientId,
    item.pointsAwarded || POINT_REWARDS.COMPLETE_ACTION,
    "Concluiu ação do plano",
    `action-complete-${itemId}`,
  );

  if (actuallyOnTime || onTime) {
    await awardPoints(
      clientId,
      POINT_REWARDS.COMPLETE_ON_TIME,
      "Concluiu ação dentro do prazo",
      `action-ontime-${itemId}`,
    );
  }

  const completedCount = await prisma.actionItem.count({
    where: {
      plan: { clientId },
      status: "CONCLUIDA",
      deletedAt: null,
    },
  });
  if (completedCount >= 3) await unlockAchievement(clientId, "THREE_ACTIONS");

  const planItems = await prisma.actionItem.findMany({
    where: { planId: item.planId, deletedAt: null },
  });
  if (planItems.every((i) => i.status === "CONCLUIDA")) {
    await prisma.actionPlan.update({
      where: { id: item.planId },
      data: { status: "CONCLUIDO" },
    });
    await awardPoints(
      clientId,
      POINT_REWARDS.WEEKLY_PLAN,
      "Completou o plano",
      `plan-complete-${item.planId}`,
    );
    await unlockAchievement(clientId, "WEEKLY_PLAN");
  }

  const manager = await prisma.managerProfile.findUnique({
    where: { id: item.plan.managerId },
  });
  if (manager) {
    await prisma.notification.create({
      data: {
        userId: manager.userId,
        title: "Ação concluída pelo cliente",
        message: `O cliente concluiu: ${item.title}. Você pode validar quando quiser.`,
        type: "ACTION_COMPLETED",
        href: `/gestor/planos/${item.planId}`,
      },
    });
  }

  await writeAuditLog({
    userId,
    entityType: "ActionItem",
    entityId: itemId,
    action: "COMPLETE_BY_CLIENT",
    previousData: item,
    newData: updated,
  });

  revalidatePath("/cliente/plano");
  revalidatePath("/cliente");
  revalidatePath("/cliente/progresso");
  revalidatePath(`/gestor/planos/${item.planId}`);
  return { success: true };
}

export async function validateActionItem(itemId: string, notes?: string) {
  const { managerId, userId } = await getManagerContext();
  const item = await prisma.actionItem.findFirst({
    where: {
      id: itemId,
      deletedAt: null,
      plan: { managerId, deletedAt: null },
    },
    include: { plan: true, validation: true },
  });
  if (!item) return { error: "Ação não encontrada." };
  if (!item.completedByClient) {
    return { error: "O gestor não pode concluir a ação em nome do cliente." };
  }
  if (item.validation) return { error: "Ação já validada." };

  await prisma.actionValidation.create({
    data: {
      actionItemId: itemId,
      validatedById: userId,
      notes: notes || null,
      approved: true,
    },
  });

  const client = await prisma.clientProfile.findUniqueOrThrow({
    where: { id: item.plan.clientId },
  });
  await prisma.notification.create({
    data: {
      userId: client.userId,
      title: "Ação validada pelo gestor",
      message: `Boa! Seu gestor validou a ação "${item.title}".`,
      type: "ACTION_VALIDATED",
      href: "/cliente/plano",
    },
  });

  await writeAuditLog({
    userId,
    entityType: "ActionValidation",
    entityId: itemId,
    action: "VALIDATE",
    newData: { approved: true, notes },
  });

  revalidatePath(`/gestor/planos/${item.planId}`);
  revalidatePath("/cliente/plano");
  return { success: true };
}
