"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { getManagerContext } from "@/lib/session";

const createClientSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome completo."),
  email: z
    .string()
    .trim()
    .email("E-mail inválido.")
    .transform((value) => value.toLowerCase()),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
  phone: z.string().trim().optional(),
  city: z.string().trim().optional(),
});

export async function createClientAccount(formData: FormData) {
  const { managerId, userId } = await getManagerContext();

  const parsed = createClientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") || undefined,
    city: formData.get("city") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { name, email, password, phone, city } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Já existe um usuário com este e-mail." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "CLIENT",
        clientProfile: {
          create: {
            phone: phone || null,
            city: city || null,
            gamification: { create: {} },
            managers: {
              create: { managerId },
            },
          },
        },
        notifications: {
          create: {
            title: "Conta criada",
            message:
              "Seu gestor criou seu acesso ao Finança Clara. Comece pelo painel do cliente.",
            type: "SISTEMA",
            href: "/cliente",
          },
        },
      },
      include: { clientProfile: true },
    });

    await writeAuditLog({
      userId,
      entityType: "ClientProfile",
      entityId: user.clientProfile!.id,
      action: "CREATE_CLIENT_ACCOUNT",
      newData: { name, email, phone, city },
    });
  } catch (error) {
    console.error(error);
    return { error: "Não foi possível criar o cliente. Tente novamente." };
  }

  revalidatePath("/gestor/clientes");
  revalidatePath("/gestor");
  return { success: true as const };
}
