import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ClipboardList,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import { isBefore } from "date-fns";
import { getManagerContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, EmptyState, PageHeader, StatCard } from "@/components/ui-legacy/card";
import { Button } from "@/components/ui-legacy/button";
import { StatusBadge } from "@/components/ui-legacy/status-badge";
import { PLAN_STATUS_LABELS } from "@/lib/labels";

const openDebtStatuses = ["EM_ABERTO", "EM_NEGOCIACAO", "RENEGOCIADO", "PENDENTE"];

function planProgress(items: { status: string }[]) {
  if (items.length === 0) return 0;
  return Math.round((items.filter((item) => item.status === "CONCLUIDA").length / items.length) * 100);
}

export default async function GestorDashboardPage() {
  const { managerId } = await getManagerContext();
  const now = new Date();

  const [clients, plans, notifications] = await Promise.all([
    prisma.clientProfile.findMany({
      where: {
        deletedAt: null,
        managers: { some: { managerId } },
      },
      include: {
        user: true,
        fixedCosts: { where: { deletedAt: null } },
        expenses: { where: { deletedAt: null } },
        debts: { where: { deletedAt: null } },
        actionPlans: {
          where: { managerId, deletedAt: null },
          include: {
            items: {
              where: { deletedAt: null },
              include: { validation: true },
              orderBy: { dueDate: "asc" },
            },
          },
          orderBy: { updatedAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.actionPlan.findMany({
      where: {
        managerId,
        deletedAt: null,
        client: { managers: { some: { managerId } } },
      },
      include: {
        client: { include: { user: true } },
        items: { where: { deletedAt: null }, include: { validation: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.notification.findMany({
      where: { user: { managerProfile: { id: managerId } }, readAt: null },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const pendingPayments = clients.reduce(
    (sum, client) =>
      sum +
      client.fixedCosts.filter((cost) => cost.financialStatus === "PENDENTE").length +
      client.expenses.filter((expense) => expense.financialStatus === "PENDENTE").length,
    0,
  );
  const overduePayments = clients.reduce(
    (sum, client) =>
      sum +
      client.fixedCosts.filter(
        (cost) => cost.financialStatus === "PENDENTE" && isBefore(cost.nextDueDate, now),
      ).length +
      client.expenses.filter(
        (expense) => expense.financialStatus === "PENDENTE" && isBefore(expense.date, now),
      ).length,
    0,
  );
  const openDebtTotal = clients.reduce(
    (sum, client) =>
      sum +
      client.debts
        .filter((debt) => openDebtStatuses.includes(debt.financialStatus))
        .reduce((subtotal, debt) => subtotal + debt.openBalance, 0),
    0,
  );
  const plansInProgress = plans.filter((plan) =>
    ["NAO_INICIADO", "EM_ANDAMENTO", "ATRASADO"].includes(plan.status),
  );
  const waitingValidation = plans.reduce(
    (sum, plan) =>
      sum +
      plan.items.filter((item) => item.completedByClient && item.validation == null).length,
    0,
  );

  const attentionClients = clients
    .map((client) => {
      const pending =
        client.fixedCosts.filter((cost) => cost.financialStatus === "PENDENTE").length +
        client.expenses.filter((expense) => expense.financialStatus === "PENDENTE").length;
      const overdue =
        client.fixedCosts.filter(
          (cost) => cost.financialStatus === "PENDENTE" && isBefore(cost.nextDueDate, now),
        ).length +
        client.expenses.filter(
          (expense) => expense.financialStatus === "PENDENTE" && isBefore(expense.date, now),
        ).length;
      const plan = client.actionPlans[0];
      const delayedActions =
        plan?.items.filter((item) => item.status !== "CONCLUIDA" && isBefore(item.dueDate, now)).length ??
        0;
      return { client, pending, overdue, delayedActions, plan };
    })
    .filter((item) => item.overdue > 0 || item.delayedActions > 0 || item.pending > 0)
    .slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Visão geral"
        description="Acompanhe seus clientes vinculados, planos ativos e pontos que precisam de atenção."
        actions={
          <Link href="/gestor/clientes">
            <Button variant="secondary">
              Ver clientes <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Clientes vinculados" value={String(clients.length)} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Pendências" value={String(pendingPayments)} hint={`${overduePayments} vencidas`} icon={<AlertCircle className="h-5 w-5" />} />
        <StatCard title="Planos em andamento" value={String(plansInProgress.length)} icon={<Target className="h-5 w-5" />} />
        <StatCard title="Dívidas abertas" value={formatCurrency(openDebtTotal)} icon={<Wallet className="h-5 w-5" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Clientes em atenção</h2>
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          {attentionClients.length === 0 ? (
            <EmptyState title="Tudo em dia" description="Nenhum cliente vinculado tem pendências críticas agora." />
          ) : (
            <ul className="space-y-3">
              {attentionClients.map(({ client, pending, overdue, delayedActions, plan }) => (
                <li key={client.id}>
                  <Link
                    href={`/gestor/clientes/${client.id}`}
                    className="block rounded-xl border border-border bg-muted/80 p-4 hover:bg-accent/60"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{client.user.name}</p>
                        <p className="text-xs text-muted-foreground">Última atualização: {formatDate(client.updatedAt)}</p>
                      </div>
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-950 dark:bg-amber-950 dark:text-amber-200">
                        {overdue > 0 ? "Vencidos" : delayedActions > 0 ? "Ações atrasadas" : "Pendências"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {pending} pagamento(s) pendente(s), {overdue} vencido(s), {delayedActions} ação(ões) atrasada(s).
                    </p>
                    {plan ? (
                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{plan.title}</span>
                          <span>{planProgress(plan.items)}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${planProgress(plan.items)}%` }} />
                        </div>
                      </div>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Planos recentes</h2>
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          {plans.length === 0 ? (
            <EmptyState
              title="Nenhum plano criado"
              description="Crie planos a partir da ficha de um cliente para orientar as próximas ações."
              action={
                <Link href="/gestor/clientes">
                  <Button variant="secondary">Escolher cliente</Button>
                </Link>
              }
            />
          ) : (
            <ul className="space-y-3">
              {plans.slice(0, 5).map((plan) => (
                <li key={plan.id}>
                  <Link
                    href={`/gestor/planos/${plan.id}`}
                    className="block rounded-xl border border-border p-4 hover:bg-accent/60"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{plan.title}</p>
                        <p className="text-sm text-muted-foreground">{plan.client.user.name}</p>
                      </div>
                      <StatusBadge status={PLAN_STATUS_LABELS[plan.status] ?? plan.status} kind="custom" />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Prazo: {formatDate(plan.dueDate)} · {plan.items.length} ação(ões)
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {waitingValidation > 0 ? (
            <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
              {waitingValidation} ação(ões) concluída(s) aguardam validação.
            </p>
          ) : null}
        </Card>
      </div>

      {notifications.length > 0 ? (
        <Card className="mt-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Notificações recentes</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {notifications.map((notification) => (
              <li key={notification.id} className="rounded-xl border border-border bg-card p-3">
                <p className="font-medium text-foreground">{notification.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
