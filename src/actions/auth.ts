"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").toLowerCase().trim();
  const password = String(formData.get("password") || "");

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof AuthError) {
      return { error: "E-mail ou senha incorretos." };
    }
    return { error: "Não foi possível entrar. Tente novamente." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "E-mail ou senha incorretos." };

  return {
    success: true as const,
    redirectTo: user.role === "MANAGER" ? "/gestor" : "/cliente",
  };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") || "").toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  void user;
  return {
    success: true as const,
    message:
      "Se este e-mail existir, enviaremos instruções para redefinir a senha. No MVP de demonstração, use a senha: 123456",
  };
}

export async function markNotificationRead(id: string) {
  const session = await requireSession();
  await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { readAt: new Date() },
  });
  revalidatePath("/cliente/notificacoes");
  revalidatePath("/gestor/notificacoes");
  return { success: true as const };
}

export async function markAllNotificationsRead() {
  const session = await requireSession();
  await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/cliente/notificacoes");
  revalidatePath("/gestor/notificacoes");
  return { success: true as const };
}
