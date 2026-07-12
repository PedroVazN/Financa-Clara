import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { isBefore } from "date-fns";
import { ArrowLeft, ClipboardList, Plus } from "lucide-react";
import { assertManagerOwnsClient, getManagerContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  ACTION_STATUS_LABELS,
  getLevelInfo,
  PLAN_STATUS_LABELS,
  RENEGOTIATION_STATUS_LABELS,
} from "@/lib/labels";
import { Button } from "@/components/ui-legacy/button";
import { Card, EmptyState, PageHeader, StatCard } from "@/components/ui-legacy/card";
import { StatusBadge } from "@/components/ui-legacy/status-badge";

type Params = Promise<{ id: string }>;

const openDebtStatuses = ["EM_ABERTO", "EM_NEGOCIACAO", "RENEGOCIADO", "PENDENTE"];

function SectionList<T>({
  title,
  items,
  empty,
  render,
}: {
  title: string;
  items: T[];
  empty: string;
  render: (item: T) => ReactNode;
}) {
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-foreground">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y divide-border">{items.map(render)}</ul>
      )}
    </Card>
  );
}

export default async function GestorClienteDetalhePage({ params }: { params: Params }) {
  const { id } = await params;
  const { managerId } = await getManagerContext();
  await assertManagerOwnsClient(managerId, id);
  const now = new Date();

  const client = await prisma.clientProfile.findFirst({
    where: { id, deletedAt: null, managers: { some: { managerId } } },
    include: {
      user: true,
      incomes: { where: { deletedAt: null }, orderBy: { receivedAt: "desc" } },
      fixedCosts: { where: { deletedAt: null }, orderBy: { nextDueDate: "asc" } },
      expenses: { where: { deletedAt: null }, orderBy: { date: "desc" } },
      debts: {
        where: { deletedAt: null },
        include: {
          renegotiations: {
            where: { deletedAt: null },
            include: { payments: { orderBy: { dueDate: "asc" } } },
            orderBy: { renegotiatedAt: "desc" },
          },
        },
        orderBy: { dueDate: "asc" },
      },
      actionPlans: {
        where: { managerId, deletedAt: null },
        include: { items: { where: { deletedAt: null }, include: { validation: true }, orderBy: { dueDate: "asc" } } },
        orderBy: { updatedAt: "desc" },
      },
      gamification: true,
      achievements: { include: { achievement: true }, orderBy: { unlockedAt: "desc" } },
      pointTransactions: { orderBy: { createdAt: "desc" }, take: 8 },
    },
  });

  if (!client) notFound();

  const totalIncomes = client.incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalFixedCosts = client.fixedCosts.reduce((sum, cost) => sum + cost.amount, 0);
  const totalExpenses = client.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const openDebts = client.debts.filter((debt) => openDebtStatuses.includes(debt.financialStatus));
  const openDebtTotal = openDebts.reduce((sum, debt) => sum + debt.openBalance, 0);
  const pendingPayments = [
    ...client.fixedCosts
      .filter((cost) => cost.financialStatus === "PENDENTE")
      .map((cost) => ({ label: cost.name, amount: cost.amount, dueDate: cost.nextDueDate, type: "Custo fixo" })),
    ...client.expenses
      .filter((expense) => expense.financialStatus === "PENDENTE")
      .map((expense) => ({ label: expense.description, amount: expense.amount, dueDate: expense.date, type: "Saída" })),
    ...client.debts
      .filter((debt) => openDebtStatuses.includes(debt.financialStatus))
      .map((debt) => ({ label: debt.name, amount: debt.openBalance, dueDate: debt.dueDate, type: "Dívida" })),
  ].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  const activePlan = client.actionPlans.find((plan) => plan.status !== "CONCLUIDO") ?? client.actionPlans[0];
  const completedItems = activePlan?.items.filter((item) => item.status === "CONCLUIDA").length ?? 0;
  const totalItems = activePlan?.items.length ?? 0;
  const planProgress = totalItems ? Math.round((completedItems / totalItems) * 100) : 0;
  const level = getLevelInfo(client.gamification?.totalPoints ?? 0);

  return (
    <div>
      <PageHeader
        title={client.user.name}
        description="Ficha de acompanhamento do cliente. Dados financeiros em modo somente leitura para o gestor."
        actions={
          <>
            <Link href="/gestor/clientes">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            {activePlan ? (
              <Link href={`/gestor/planos/${activePlan.id}`}>
                <Button>
                  <ClipboardList className="h-4 w-4" />
                  Editar plano
                </Button>
              </Link>
            ) : (
              <Link href={`/gestor/planos/novo?clientId=${client.id}`}>
                <Button>
                  <Plus className="h-4 w-4" />
                  Criar plano
                </Button>
              </Link>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Entradas" value={formatCurrency(totalIncomes)} />
        <StatCard title="Custos fixos" value={formatCurrency(totalFixedCosts)} />
        <StatCard title="Saídas" value={formatCurrency(totalExpenses)} />
        <StatCard title="Dívidas abertas" value={formatCurrency(openDebtTotal)} hint={`${openDebts.length} em acompanhamento`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SectionList
          title="Entradas"
          items={client.incomes}
          empty="Nenhuma entrada cadastrada."
          render={(income) => (
            <li key={income.id} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{income.description}</p>
                  <p className="text-xs text-muted-foreground">{income.category} · {formatDate(income.receivedAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{formatCurrency(income.amount)}</p>
                  <StatusBadge status={income.financialStatus} />
                </div>
              </div>
            </li>
          )}
        />

        <SectionList
          title="Custos fixos"
          items={client.fixedCosts}
          empty="Nenhum custo fixo cadastrado."
          render={(cost) => (
            <li key={cost.id} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{cost.name}</p>
                  <p className="text-xs text-muted-foreground">{cost.category} · Próximo vencimento {formatDate(cost.nextDueDate)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{formatCurrency(cost.amount)}</p>
                  <StatusBadge status={cost.financialStatus} />
                </div>
              </div>
            </li>
          )}
        />

        <SectionList
          title="Saídas"
          items={client.expenses}
          empty="Nenhuma saída cadastrada."
          render={(expense) => (
            <li key={expense.id} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{expense.description}</p>
                  <p className="text-xs text-muted-foreground">{expense.category} · {formatDate(expense.date)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{formatCurrency(expense.amount)}</p>
                  <StatusBadge status={expense.financialStatus} />
                </div>
              </div>
            </li>
          )}
        />

        <SectionList
          title="Dívidas"
          items={client.debts}
          empty="Nenhuma dívida cadastrada."
          render={(debt) => (
            <li key={debt.id} className="py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{debt.name}</p>
                  <p className="text-xs text-muted-foreground">{debt.creditor} · Vencimento {formatDate(debt.dueDate)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Original: {formatCurrency(debt.originalAmount)} · Aberto: {formatCurrency(debt.openBalance)}
                  </p>
                </div>
                <div className="text-right">
                  <StatusBadge status={debt.financialStatus} />
                  <div className="mt-2">
                    <StatusBadge status={debt.priority} kind="priority" />
                  </div>
                </div>
              </div>
            </li>
          )}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Renegociações</h2>
          {client.debts.flatMap((debt) => debt.renegotiations).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma renegociação cadastrada.</p>
          ) : (
            <ul className="space-y-3">
              {client.debts.flatMap((debt) =>
                debt.renegotiations.map((renegotiation) => (
                  <li key={renegotiation.id} className="rounded-xl border border-border p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{debt.name}</p>
                        <p className="text-sm text-muted-foreground">{renegotiation.agreementDesc}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatCurrency(renegotiation.totalAmount)} em {renegotiation.paymentCount} parcela(s)
                        </p>
                      </div>
                      <StatusBadge status={RENEGOTIATION_STATUS_LABELS[renegotiation.status] ?? renegotiation.status} kind="custom" />
                    </div>
                  </li>
                )),
              )}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Pagamentos pendentes</h2>
          {pendingPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum pagamento pendente.</p>
          ) : (
            <ul className="space-y-3">
              {pendingPayments.slice(0, 8).map((payment) => (
                <li key={`${payment.type}-${payment.label}-${payment.dueDate.toISOString()}`} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                  <div>
                    <p className="font-medium text-foreground">{payment.label}</p>
                    <p className="text-xs text-muted-foreground">{payment.type} · {formatDate(payment.dueDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatCurrency(payment.amount)}</p>
                    {isBefore(payment.dueDate, now) ? <p className="text-xs font-semibold text-rose-700">Vencido</p> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Plano de ação</h2>
            {activePlan ? (
              <Link href={`/gestor/planos/${activePlan.id}`} className="text-sm font-semibold text-primary">
                Abrir plano
              </Link>
            ) : null}
          </div>
          {activePlan ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-foreground">{activePlan.title}</p>
                <StatusBadge status={PLAN_STATUS_LABELS[activePlan.status] ?? activePlan.status} kind="custom" />
                <StatusBadge status={activePlan.priority} kind="priority" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{activePlan.objective}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${planProgress}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{completedItems}/{totalItems} ações concluídas</p>
              <ul className="mt-4 space-y-3">
                {activePlan.items.slice(0, 6).map((item) => (
                  <li key={item.id} className="rounded-xl border border-border p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">Prazo: {formatDate(item.dueDate)}</p>
                      </div>
                      <StatusBadge status={ACTION_STATUS_LABELS[item.status] ?? item.status} kind="custom" />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <EmptyState
              title="Sem plano de ação"
              description="Crie um plano para orientar este cliente."
              action={
                <Link href={`/gestor/planos/novo?clientId=${client.id}`}>
                  <Button>Criar plano</Button>
                </Link>
              }
            />
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Gamificação</h2>
          <p className="text-3xl font-bold text-primary">Nível {level.level} · {level.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {client.gamification?.totalPoints ?? 0} pontos · {level.pointsToNext > 0 ? `${level.pointsToNext} para o próximo nível` : "nível máximo atual"}
          </p>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-leaf" style={{ width: `${level.progress}%` }} />
          </div>
          {client.achievements.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {client.achievements.slice(0, 5).map((achievement) => (
                <li key={achievement.id} className="rounded-xl bg-muted p-3">
                  <p className="font-medium text-foreground">{achievement.achievement.title}</p>
                  <p className="text-xs text-muted-foreground">Desbloqueado em {formatDate(achievement.unlockedAt)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Nenhuma conquista desbloqueada ainda.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
