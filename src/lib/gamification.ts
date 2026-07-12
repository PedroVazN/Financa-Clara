import { prisma } from "@/lib/prisma";
import { getLevelInfo, POINT_REWARDS } from "@/lib/labels";

export async function awardPoints(
  clientId: string,
  points: number,
  reason: string,
  sourceKey: string,
) {
  const existing = await prisma.pointTransaction.findUnique({
    where: { clientId_sourceKey: { clientId, sourceKey } },
  });
  if (existing) return null;

  const profile = await prisma.gamificationProfile.upsert({
    where: { clientId },
    create: {
      clientId,
      totalPoints: points,
      level: 1,
      streakDays: 1,
      lastActivityAt: new Date(),
    },
    update: {
      totalPoints: { increment: points },
      lastActivityAt: new Date(),
      streakDays: { increment: 1 },
    },
  });

  await prisma.pointTransaction.create({
    data: { clientId, points, reason, sourceKey },
  });

  const updated = await prisma.gamificationProfile.findUniqueOrThrow({
    where: { clientId },
  });

  const levelInfo = getLevelInfo(updated.totalPoints);
  if (levelInfo.level !== updated.level) {
    await prisma.gamificationProfile.update({
      where: { clientId },
      data: { level: levelInfo.level },
    });

    const client = await prisma.clientProfile.findUnique({
      where: { id: clientId },
      select: { userId: true },
    });
    if (client) {
      await prisma.notification.create({
        data: {
          userId: client.userId,
          title: "Você subiu de nível!",
          message: `Boa! Agora você está no nível ${levelInfo.level}: ${levelInfo.name}. Seu progresso está crescendo.`,
          type: "LEVEL_UP",
          href: "/cliente/progresso",
        },
      });
    }
  } else {
    const client = await prisma.clientProfile.findUnique({
      where: { id: clientId },
      select: { userId: true },
    });
    if (client) {
      await prisma.notification.create({
        data: {
          userId: client.userId,
          title: "Pontos conquistados",
          message: `+${points} pontos: ${reason}`,
          type: "POINTS",
          href: "/cliente/progresso",
        },
      });
    }
  }

  return profile;
}

export async function unlockAchievement(clientId: string, code: string) {
  const achievement = await prisma.achievement.findUnique({ where: { code } });
  if (!achievement) return;

  try {
    await prisma.userAchievement.create({
      data: { clientId, achievementId: achievement.id },
    });

    const client = await prisma.clientProfile.findUnique({
      where: { id: clientId },
      select: { userId: true },
    });
    if (client) {
      await prisma.notification.create({
        data: {
          userId: client.userId,
          title: "Nova conquista",
          message: `Você desbloqueou: ${achievement.title}. ${achievement.description}`,
          type: "ACHIEVEMENT",
          href: "/cliente/progresso",
        },
      });
    }
  } catch {
    // já desbloqueada
  }
}

export { POINT_REWARDS };
