import Link from "next/link";
import { isBefore } from "date-fns";
import { Search } from "lucide-react";
import { PlanStatus } from "@prisma/client";
import { getManagerContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { getLevelInfo, PLAN_STATUS_LABELS } from "@/lib/labels";
import { Card, EmptyState, PageHeader } from "@/components/ui-legacy/card";
import { Button } from "@/components/ui-legacy/button";
import { Field, Input, Select } from "@/components/ui-legacy/field";
import { StatusBadge } from "@/components/ui-legacy/status-badge";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const openDebtStatuses = ["EM_ABERTO", "EM_NEGOCIACAO", "RENEGOCIADO", "PENDENTE"];

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function progress(items: { status: string }[]) {
  if (items.length === 0) return 0;
  return Math.round((items.filter((item) => item.status === "CONCLUIDA").length / items.length) * 100);
}

export default async function GestorClientesPage({ searchParams }: { searchParams: SearchParams }) {
  const { managerId } = await getManagerContext();
  const params = await searchParams;
  const name = getParam(params, "name")?.trim() ?? "";
  const hasOpenDebt = getParam(params, "hasOpenDebt") === "true";
  const hasOverdue = getParam(params, "hasOverdue") === "true";
  const hasPlan = getParam(params, "hasPlan") === "true";
  const planStatus = getParam(params, "planStatus") ?? "";
  const selectedPlanStatus = Object.values(PlanStatus).includes(planStatus as PlanStatus)
    ? (planStatus as PlanStatus)
    : undefined;
  const now = new Date();

  const clients = await prisma.clientProfile.findMany({
    where: {
      deletedAt: null,
      managers: { some: { managerId } },
      user: name ? { name: { contains: name } } : undefined,
    },
    include: {
      user: true,
      fixedCosts: { where: { deletedAt: null } },
      expenses: { where: { deletedAt: null } },
      debts: { where: { deletedAt: null } },
      gamification: true,
      actionPlans: {
        where: {
          managerId,
          deletedAt: null,
          status: selectedPlanStatus,
        },
        include: { items: { where: { deletedAt: null } } },
        orderBy: { updatedAt: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const rows = clients
    .map((client) => {
      const pendingCount =
        client.fixedCosts.filter((cost) => cost.financialStatus === "PENDENTE").length +
        client.expenses.filter((expense) => expense.financialStatus === "PENDENTE").length;
      const overdueCount =
        client.fixedCosts.filter(
          (cost) => cost.financialStatus === "PENDENTE" && isBefore(cost.nextDueDate, now),
        ).length +
        client.expenses.filter(
          (expense) => expense.financialStatus === "PENDENTE" && isBefore(expense.date, now),
        ).length +
        client.debts.filter((debt) => openDebtStatuses.includes(debt.financialStatus) && isBefore(debt.dueDate, now)).length;
      const openDebts = client.debts.filter((debt) => openDebtStatuses.includes(debt.financialStatus));
      const openDebtTotal = openDebts.reduce((sum, debt) => sum + debt.openBalance, 0);
      const nextDue = [
        ...client.fixedCosts
          .filter((cost) => cost.financialStatus === "PENDENTE")
          .map((cost) => cost.nextDueDate),
        ...client.expenses
          .filter((expense) => expense.financialStatus === "PENDENTE")
          .map((expense) => expense.date),
        ...openDebts.map((debt) => debt.dueDate),
      ].sort((a, b) => a.getTime() - b.getTime())[0];
      const plan = client.actionPlans[0] ?? null;
      const level = getLevelInfo(client.gamification?.totalPoints ?? 0);
      const delayedActions =
        plan?.items.filter((item) => item.status !== "CONCLUIDA" && isBefore(item.dueDate, now)).length ?? 0;

      return {
        client,
        pendingCount,
        overdueCount,
        openDebtTotal,
        nextDue,
        plan,
        planProgress: plan ? progress(plan.items) : 0,
        points: client.gamification?.totalPoints ?? 0,
        level,
        delayedActions,
      };
    })
    .filter((row) => (hasOpenDebt ? row.openDebtTotal > 0 : true))
    .filter((row) => (hasOverdue ? row.overdueCount > 0 : true))
    .filter((row) => (hasPlan ? row.plan != null : true))
    .filter((row) => (planStatus ? row.plan != null : true));

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Lista de clientes vinculados ao seu perfil de gestor."
      />

      <Card className="mb-6">
        <form className="grid gap-4 md:grid-cols-5">
          <Field label="Nome" htmlFor="name">
            <Input id="name" name="name" defaultValue={name} placeholder="Buscar cliente" />
          </Field>
          <Field label="Dívida aberta" htmlFor="hasOpenDebt">
            <Select id="hasOpenDebt" name="hasOpenDebt" defaultValue={hasOpenDebt ? "true" : ""}>
              <option value="">Todos</option>
              <option value="true">Com dívida aberta</option>
            </Select>
          </Field>
          <Field label="Vencidos" htmlFor="hasOverdue">
            <Select id="hasOverdue" name="hasOverdue" defaultValue={hasOverdue ? "true" : ""}>
              <option value="">Todos</option>
              <option value="true">Com atraso</option>
            </Select>
          </Field>
          <Field label="Plano" htmlFor="hasPlan">
            <Select id="hasPlan" name="hasPlan" defaultValue={hasPlan ? "true" : ""}>
              <option value="">Todos</option>
              <option value="true">Com plano</option>
            </Select>
          </Field>
          <Field label="Status do plano" htmlFor="planStatus">
            <Select id="planStatus" name="planStatus" defaultValue={planStatus}>
              <option value="">Todos</option>
              <option value="NAO_INICIADO">Não iniciado</option>
              <option value="EM_ANDAMENTO">Em andamento</option>
              <option value="CONCLUIDO">Concluído</option>
              <option value="ATRASADO">Atrasado</option>
              <option value="PAUSADO">Pausado</option>
            </Select>
          </Field>
          <div className="md:col-span-5">
            <Button type="submit">
              <Search className="h-4 w-4" />
              Filtrar
            </Button>
          </div>
        </form>
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          title="Nenhum cliente encontrado"
          description="Ajuste os filtros ou confirme se há clientes vinculados ao seu perfil."
        />
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <Link
              key={row.client.id}
              href={`/gestor/clientes/${row.client.id}`}
              className="block rounded-2xl border border-white/60 bg-card p-5 shadow-sm transition hover:bg-accent/70"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-foreground">{row.client.user.name}</h2>
                    {row.overdueCount > 0 ? (
                      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-800">
                        Atenção
                      </span>
                    ) : row.pendingCount > 0 || row.delayedActions > 0 ? (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900">
                        Acompanhar
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                        Em dia
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {row.pendingCount} pendência(s) · {formatCurrency(row.openDebtTotal)} em aberto · Próximo vencimento: {formatDate(row.nextDue)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.points} pts · Nível {row.level.level}: {row.level.name} · Atualizado em {formatDate(row.client.updatedAt)}
                  </p>
                </div>

                <div className="w-full max-w-sm">
                  {row.plan ? (
                    <>
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">{row.plan.title}</span>
                        <StatusBadge status={PLAN_STATUS_LABELS[row.plan.status] ?? row.plan.status} kind="custom" />
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${row.planProgress}%` }} />
                      </div>
                      <p className="mt-1 text-right text-xs text-muted-foreground">{row.planProgress}% do plano</p>
                    </>
                  ) : (
                    <p className="rounded-xl bg-muted px-3 py-2 text-sm font-medium text-muted-foreground">
                      Sem plano ativo
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
