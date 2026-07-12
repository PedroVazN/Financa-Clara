import { isBefore, subDays } from "date-fns";
import { getManagerContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { PLAN_STATUS_LABELS, RENEGOTIATION_STATUS_LABELS } from "@/lib/labels";
import { CsvExportButton } from "@/components/manager/csv-export-button";
import { PrintReportButton } from "@/components/manager/print-report-button";
import { Card, EmptyState, PageHeader, StatCard } from "@/components/ui-legacy/card";
import { StatusBadge } from "@/components/ui-legacy/status-badge";

const openDebtStatuses = ["EM_ABERTO", "EM_NEGOCIACAO", "RENEGOCIADO", "PENDENTE"];

function percent(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.round((value / max) * 100);
}

export default async function GestorRelatoriosPage() {
  const { managerId } = await getManagerContext();
  const now = new Date();
  const staleDate = subDays(now, 15);

  const clients = await prisma.clientProfile.findMany({
    where: { deletedAt: null, managers: { some: { managerId } } },
    include: {
      user: true,
      fixedCosts: { where: { deletedAt: null } },
      expenses: { where: { deletedAt: null } },
      debts: { where: { deletedAt: null }, include: { renegotiations: { where: { deletedAt: null } } } },
      actionPlans: {
        where: { managerId, deletedAt: null },
        include: { items: { where: { deletedAt: null } } },
      },
    },
  });

  const reportRows = clients.map((client) => {
    const pendingPayments =
      client.fixedCosts.filter((cost) => cost.financialStatus === "PENDENTE").length +
      client.expenses.filter((expense) => expense.financialStatus === "PENDENTE").length +
      client.debts.filter((debt) => openDebtStatuses.includes(debt.financialStatus)).length;
    const overdue =
      client.fixedCosts.filter((cost) => cost.financialStatus === "PENDENTE" && isBefore(cost.nextDueDate, now)).length +
      client.expenses.filter((expense) => expense.financialStatus === "PENDENTE" && isBefore(expense.date, now)).length +
      client.debts.filter((debt) => openDebtStatuses.includes(debt.financialStatus) && isBefore(debt.dueDate, now)).length;
    const delayedActions = client.actionPlans.reduce(
      (sum, plan) => sum + plan.items.filter((item) => item.status !== "CONCLUIDA" && isBefore(item.dueDate, now)).length,
      0,
    );
    const openDebtTotal = client.debts
      .filter((debt) => openDebtStatuses.includes(debt.financialStatus))
      .reduce((sum, debt) => sum + debt.openBalance, 0);
    const negotiations = client.debts.flatMap((debt) => debt.renegotiations);

    return {
      id: client.id,
      name: client.user.name,
      pendingScore: pendingPayments + overdue + delayedActions,
      pendingPayments,
      overdue,
      delayedActions,
      openDebtTotal,
      updatedAt: client.updatedAt,
      completedPlans: client.actionPlans.filter((plan) => plan.status === "CONCLUIDO").length,
      delayedPlans: client.actionPlans.filter((plan) => plan.status === "ATRASADO" || isBefore(plan.dueDate, now)).length,
      negotiations,
    };
  });

  const mostPending = [...reportRows].sort((a, b) => b.pendingScore - a.pendingScore).slice(0, 5);
  const withoutRecentUpdate = reportRows.filter((row) => isBefore(row.updatedAt, staleDate));
  const completedPlans = clients.flatMap((client) =>
    client.actionPlans
      .filter((plan) => plan.status === "CONCLUIDO")
      .map((plan) => ({ ...plan, clientName: client.user.name })),
  );
  const delayedPlans = clients.flatMap((client) =>
    client.actionPlans
      .filter((plan) => plan.status === "ATRASADO" || isBefore(plan.dueDate, now))
      .map((plan) => ({ ...plan, clientName: client.user.name })),
  );
  const debtsInNegotiation = clients.flatMap((client) =>
    client.debts
      .filter((debt) => debt.financialStatus === "EM_NEGOCIACAO" || debt.renegotiations.length > 0)
      .map((debt) => ({ ...debt, clientName: client.user.name })),
  );
  const maxPending = Math.max(...mostPending.map((row) => row.pendingScore), 0);

  const csvRows = reportRows.map((row) => ({
    cliente: row.name,
    pendencias: row.pendingScore,
    pagamentosPendentes: row.pendingPayments,
    vencidos: row.overdue,
    acoesAtrasadas: row.delayedActions,
    dividasEmAberto: row.openDebtTotal,
    planosConcluidos: row.completedPlans,
    planosAtrasados: row.delayedPlans,
    ultimaAtualizacao: formatDate(row.updatedAt),
  }));

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description="Indicadores simples para priorizar acompanhamento e exportar dados do gestor."
        actions={
          <>
            <CsvExportButton rows={csvRows} fileName="relatorio-gestor.csv" />
            <PrintReportButton />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Clientes" value={String(clients.length)} />
        <StatCard title="Mais pendências" value={String(reportRows.reduce((sum, row) => sum + row.pendingScore, 0))} />
        <StatCard title="Sem atualização" value={String(withoutRecentUpdate.length)} hint="Mais de 15 dias" />
        <StatCard title="Planos concluídos" value={String(completedPlans.length)} />
        <StatCard title="Dívidas em negociação" value={String(debtsInNegotiation.length)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Clientes com mais pendências</h2>
          {mostPending.length === 0 ? (
            <EmptyState title="Sem dados" description="Ainda não há clientes para compor o relatório." />
          ) : (
            <ul className="space-y-4">
              {mostPending.map((row) => (
                <li key={row.id}>
                  <div className="mb-1 flex justify-between gap-3 text-sm">
                    <span className="font-medium text-foreground">{row.name}</span>
                    <span className="text-muted-foreground">{row.pendingScore} ponto(s) de atenção</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${percent(row.pendingScore, maxPending)}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.overdue} vencido(s), {row.delayedActions} ação(ões) atrasada(s), {formatCurrency(row.openDebtTotal)} em aberto
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Sem atualização recente</h2>
          {withoutRecentUpdate.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todos os clientes tiveram atualização nos últimos 15 dias.</p>
          ) : (
            <ul className="space-y-3">
              {withoutRecentUpdate.map((row) => (
                <li key={row.id} className="rounded-xl border border-border p-3">
                  <p className="font-medium text-foreground">{row.name}</p>
                  <p className="text-xs text-muted-foreground">Última atualização: {formatDate(row.updatedAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Planos concluídos</h2>
          {completedPlans.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum plano concluído ainda.</p>
          ) : (
            <ul className="space-y-3">
              {completedPlans.slice(0, 8).map((plan) => (
                <li key={plan.id} className="rounded-xl border border-border p-3">
                  <p className="font-medium text-foreground">{plan.title}</p>
                  <p className="text-xs text-muted-foreground">{plan.clientName} · Prazo {formatDate(plan.dueDate)}</p>
                  <div className="mt-2">
                    <StatusBadge status={PLAN_STATUS_LABELS[plan.status] ?? plan.status} kind="custom" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Planos atrasados</h2>
          {delayedPlans.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum plano atrasado.</p>
          ) : (
            <ul className="space-y-3">
              {delayedPlans.slice(0, 8).map((plan) => (
                <li key={plan.id} className="rounded-xl border border-rose-100 bg-rose-50 p-3">
                  <p className="font-medium text-rose-950">{plan.title}</p>
                  <p className="text-xs text-rose-800">{plan.clientName} · Prazo {formatDate(plan.dueDate)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Dívidas em negociação</h2>
        {debtsInNegotiation.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma dívida em negociação.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {debtsInNegotiation.map((debt) => (
              <div key={debt.id} className="rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{debt.name}</p>
                    <p className="text-xs text-muted-foreground">{debt.clientName} · {debt.creditor}</p>
                    <p className="mt-1 text-sm text-foreground">{formatCurrency(debt.openBalance)} em aberto</p>
                  </div>
                  <StatusBadge status={debt.financialStatus} />
                </div>
                {debt.renegotiations[0] ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Última negociação: {RENEGOTIATION_STATUS_LABELS[debt.renegotiations[0].status] ?? debt.renegotiations[0].status}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
