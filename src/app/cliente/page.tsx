import Link from "next/link";
import {
  ArrowRight,
  PiggyBank,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Wallet,
} from "lucide-react";
import { getClientContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { getLevelInfo } from "@/lib/labels";
import { Card, StatCard } from "@/components/ui-legacy/card";
import { StatusBadge } from "@/components/ui-legacy/status-badge";
import { Button } from "@/components/ui-legacy/button";
import { startOfMonth, endOfMonth } from "date-fns";

export default async function ClienteDashboardPage() {
  const { clientId } = await getClientContext();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    incomes,
    expenses,
    fixedCosts,
    debts,
    plan,
    gamification,
    notifications,
  ] = await Promise.all([
    prisma.income.findMany({
      where: {
        clientId,
        deletedAt: null,
        receivedAt: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.expense.findMany({
      where: {
        clientId,
        deletedAt: null,
        date: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.fixedCost.findMany({ where: { clientId, deletedAt: null } }),
    prisma.debt.findMany({ where: { clientId, deletedAt: null } }),
    prisma.actionPlan.findFirst({
      where: { clientId, deletedAt: null, status: { not: "CONCLUIDO" } },
      include: { items: { where: { deletedAt: null }, orderBy: { dueDate: "asc" } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.gamificationProfile.findUnique({ where: { clientId } }),
    prisma.notification.findMany({
      where: {
        user: { clientProfile: { id: clientId } },
        readAt: null,
      },
      take: 3,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalIncomes = incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s, i) => s + i.amount, 0);
  const totalFixed = fixedCosts.reduce((s, i) => s + i.amount, 0);
  const openDebts = debts.filter((d) =>
    ["EM_ABERTO", "EM_NEGOCIACAO", "RENEGOCIADO", "PENDENTE"].includes(
      d.financialStatus,
    ),
  );
  const openDebtTotal = openDebts.reduce((s, d) => s + d.openBalance, 0);

  const pendingPayments =
    fixedCosts.filter((c) => c.financialStatus === "PENDENTE").length +
    expenses.filter((e) => e.financialStatus === "PENDENTE").length;
  const paidPayments =
    fixedCosts.filter((c) => c.financialStatus === "PAGO").length +
    expenses.filter((e) => e.financialStatus === "PAGO").length;

  const upcoming = [
    ...fixedCosts.map((c) => ({
      label: c.name,
      date: c.nextDueDate,
      amount: c.amount,
      href: "/cliente/custos-fixos",
    })),
    ...openDebts.map((d) => ({
      label: d.name,
      date: d.dueDate,
      amount: d.openBalance,
      href: `/cliente/dividas/${d.id}`,
    })),
  ]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 4);

  const level = getLevelInfo(gamification?.totalPoints ?? 0);
  const nextActions =
    plan?.items.filter((i) => i.status !== "CONCLUIDA").slice(0, 4) ?? [];
  const planProgress = plan?.items.length
    ? (plan.items.filter((i) => i.status === "CONCLUIDA").length /
        plan.items.length) *
      100
    : 0;

  return (
    <div>
      {/* Thesis: próximo passo assistivo — não um grid de métricas */}
      <section className="clareira-glow mb-8">
        <p className="text-sm font-medium text-primary">
          Seu próximo passo
        </p>
        <h1 className="mt-2 max-w-2xl font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          O que fazer agora
        </h1>
        <p className="mt-2 max-w-xl text-base text-muted-foreground">
          Orientações do seu gestor, em ordem simples — sem pressão, com clareza.
        </p>
      </section>

      <Card className="mb-8 border-primary/20 bg-secondary p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Target className="size-5 text-primary" aria-hidden />
            <h2 className="font-display text-lg font-semibold text-foreground">
              Ações recomendadas
            </h2>
          </div>
          <Link href="/cliente/plano">
            <Button variant="secondary">
              Ver plano completo <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>

        {nextActions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma ação pendente no momento. Quando houver orientações do gestor,
            elas aparecerão aqui.
          </p>
        ) : (
          <ul className="space-y-3">
            {nextActions.map((action) => (
              <li
                key={action.id}
                className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">{action.title}</p>
                  <StatusBadge status={action.priority} kind="priority" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Até {formatDate(action.dueDate)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
            Próximos vencimentos
          </h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Você ainda não tem vencimentos próximos cadastrados.
            </p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((item) => (
                <li key={`${item.label}-${item.date.toISOString()}`}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between rounded-xl px-3 py-3 transition-colors hover:bg-secondary dark:hover:bg-accent"
                  >
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(item.date)}
                      </p>
                    </div>
                    <p className="font-semibold text-foreground">
                      {formatCurrency(item.amount)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
            Seu ritmo
          </h2>
          <p className="font-display text-3xl font-semibold text-primary">
            Nível {level.level} · {level.name}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {level.pointsToNext > 0
              ? `Faltam ${level.pointsToNext} pontos para o próximo nível.`
              : "Você alcançou o nível máximo atual."}
          </p>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${level.progress}%` }}
            />
          </div>
          {plan ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Plano “{plan.title}” · {Math.round(planProgress)}% concluído
            </p>
          ) : null}
          {notifications.length > 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Você tem {notifications.length} notificação(ões) nova(s).
            </p>
          ) : null}
          <Link
            href="/cliente/progresso"
            className="mt-3 inline-block text-sm font-semibold text-primary"
          >
            Ver meu progresso
          </Link>
        </Card>
      </div>

      <section className="mt-8">
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
          Resumo do mês
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Entradas do período"
            value={formatCurrency(totalIncomes)}
            hint="Mês atual"
            icon={<TrendingUp className="size-5" />}
          />
          <StatCard
            title="Saídas do período"
            value={formatCurrency(totalExpenses)}
            hint="Mês atual"
            icon={<TrendingDown className="size-5" />}
          />
          <StatCard
            title="Custos fixos"
            value={formatCurrency(totalFixed)}
            hint={`${fixedCosts.length} cadastrados`}
            icon={<Wallet className="size-5" />}
          />
          <StatCard
            title="Dívidas em aberto"
            value={formatCurrency(openDebtTotal)}
            hint={`${openDebts.length} em acompanhamento`}
            icon={<PiggyBank className="size-5" />}
          />
          <StatCard
            title="Pagamentos pendentes"
            value={String(pendingPayments)}
            hint={`${paidPayments} concluídos`}
          />
          <StatCard
            title="Pontuação"
            value={`${gamification?.totalPoints ?? 0} pts`}
            hint={`Nível ${level.level}: ${level.name}`}
            icon={<Trophy className="size-5" />}
          />
        </div>
      </section>
    </div>
  );
}
