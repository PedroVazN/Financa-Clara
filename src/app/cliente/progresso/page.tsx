import { Card, EmptyState, PageHeader, StatCard } from "@/components/ui-legacy/card";
import { formatDateTime } from "@/lib/format";
import { getLevelInfo } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { getClientContext } from "@/lib/session";

export default async function ProgressoPage() {
  const { clientId } = await getClientContext();

  const [gamification, achievements, transactions] = await Promise.all([
    prisma.gamificationProfile.findUnique({ where: { clientId } }),
    prisma.userAchievement.findMany({
      where: { clientId },
      include: { achievement: true },
      orderBy: { unlockedAt: "desc" },
    }),
    prisma.pointTransaction.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const totalPoints = gamification?.totalPoints ?? 0;
  const level = getLevelInfo(totalPoints);
  const streak = gamification?.streakDays ?? 0;
  const friendlyMessage =
    totalPoints === 0
      ? "Comece cadastrando suas informações financeiras. Cada passo conta."
      : level.pointsToNext > 0
        ? `Você está a ${level.pointsToNext} ponto(s) do próximo nível. Continue avançando no seu ritmo.`
        : "Você chegou ao maior nível disponível agora. Excelente consistência!";

  return (
    <div>
      <PageHeader
        title="Meu progresso"
        description="Veja seus pontos, conquistas e evolução no plano financeiro."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pontos" value={`${totalPoints} pts`} hint="Total acumulado" />
        <StatCard title="Nível" value={`${level.level}`} hint={level.name} />
        <StatCard title="Sequência" value={`${streak} dia(s)`} hint="Atividades registradas" />
        <StatCard
          title="Conquistas"
          value={`${achievements.length}`}
          hint="Desbloqueadas até agora"
        />
      </div>

      <Card className="mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Nível {level.level}: {level.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{friendlyMessage}</p>
          </div>
          {level.nextLevelName ? (
            <p className="text-sm font-medium text-primary">
              Próximo: {level.nextLevelName}
            </p>
          ) : null}
        </div>
        <div className="mt-5 h-4 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-leaf"
            style={{ width: `${level.progress}%` }}
          />
        </div>
        <p className="mt-2 text-right text-sm font-medium text-muted-foreground">
          {level.progress}% do caminho
        </p>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Conquistas</h2>
          {achievements.length === 0 ? (
            <EmptyState
              title="Nenhuma conquista desbloqueada ainda"
              description="Ao concluir ações e registrar movimentações, suas conquistas aparecerão aqui."
            />
          ) : (
            <div className="space-y-3">
              {achievements.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border bg-accent/70 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl" aria-hidden>
                      {item.achievement.icon ?? "*"}
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">
                        {item.achievement.title}
                      </p>
                      <p className="text-sm text-foreground">
                        {item.achievement.description}
                      </p>
                      <p className="mt-1 text-xs text-primary">
                        Desbloqueada em {formatDateTime(item.unlockedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Pontos recentes
          </h2>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda não há movimentações de pontos. Complete uma ação para começar.
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border p-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{transaction.reason}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(transaction.createdAt)}
                    </p>
                  </div>
                  <p className="font-bold text-primary">+{transaction.points}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
