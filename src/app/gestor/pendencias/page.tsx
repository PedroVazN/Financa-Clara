import Link from "next/link";
import { isBefore } from "date-fns";
import { AlertCircle } from "lucide-react";
import { getManagerContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui-legacy/button";
import { Card, EmptyState, PageHeader } from "@/components/ui-legacy/card";
import { StatusBadge } from "@/components/ui-legacy/status-badge";

const openDebtStatuses = ["EM_ABERTO", "EM_NEGOCIACAO", "RENEGOCIADO", "PENDENTE"];

export default async function GestorPendenciasPage() {
  const { managerId } = await getManagerContext();
  const now = new Date();
  const clients = await prisma.clientProfile.findMany({
    where: { deletedAt: null, managers: { some: { managerId } } },
    include: {
      user: true,
      fixedCosts: { where: { deletedAt: null } },
      expenses: { where: { deletedAt: null } },
      debts: { where: { deletedAt: null } },
      actionPlans: {
        where: { managerId, deletedAt: null },
        include: { items: { where: { deletedAt: null }, include: { validation: true } } },
        orderBy: { updatedAt: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const rows = clients
    .map((client) => {
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
      const overdue = pendingPayments.filter((payment) => isBefore(payment.dueDate, now));
      const delayedActions = client.actionPlans.flatMap((plan) =>
        plan.items
          .filter((item) => item.status !== "CONCLUIDA" && isBefore(item.dueDate, now))
          .map((item) => ({ ...item, planTitle: plan.title, planId: plan.id })),
      );
      const waitingValidation = client.actionPlans.flatMap((plan) =>
        plan.items
          .filter((item) => item.completedByClient && item.validation == null)
          .map((item) => ({ ...item, planTitle: plan.title, planId: plan.id })),
      );
      return { client, pendingPayments, overdue, delayedActions, waitingValidation };
    })
    .filter(
      (row) =>
        row.pendingPayments.length > 0 ||
        row.overdue.length > 0 ||
        row.delayedActions.length > 0 ||
        row.waitingValidation.length > 0,
    );

  return (
    <div>
      <PageHeader
        title="Pendências"
        description="Clientes com pagamentos pendentes, vencidos, ações atrasadas ou validações aguardando o gestor."
      />

      {rows.length === 0 ? (
        <EmptyState title="Nenhuma pendência" description="Os clientes vinculados estão sem pendências relevantes no momento." />
      ) : (
        <div className="space-y-5">
          {rows.map((row) => (
            <Card key={row.client.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{row.client.user.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {row.pendingPayments.length} pagamento(s), {row.overdue.length} vencido(s), {row.delayedActions.length} ação(ões) atrasada(s), {row.waitingValidation.length} validação(ões)
                  </p>
                </div>
                <Link href={`/gestor/clientes/${row.client.id}`}>
                  <Button variant="secondary">Abrir cliente</Button>
                </Link>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    Pagamentos
                  </h3>
                  {row.pendingPayments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem pagamentos pendentes.</p>
                  ) : (
                    <ul className="space-y-2">
                      {row.pendingPayments.slice(0, 5).map((payment) => (
                        <li key={`${payment.type}-${payment.label}-${payment.dueDate.toISOString()}`} className="rounded-xl bg-muted p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-foreground">{payment.label}</p>
                              <p className="text-xs text-muted-foreground">{payment.type} · {formatDate(payment.dueDate)}</p>
                            </div>
                            <p className="font-semibold text-foreground">{formatCurrency(payment.amount)}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Ações atrasadas</h3>
                  {row.delayedActions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem ações atrasadas.</p>
                  ) : (
                    <ul className="space-y-2">
                      {row.delayedActions.slice(0, 5).map((action) => (
                        <li key={action.id} className="rounded-xl bg-rose-50 p-3">
                          <p className="font-medium text-rose-950">{action.title}</p>
                          <p className="text-xs text-rose-800">{action.planTitle} · {formatDate(action.dueDate)}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Validações</h3>
                  {row.waitingValidation.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem validações pendentes.</p>
                  ) : (
                    <ul className="space-y-2">
                      {row.waitingValidation.slice(0, 5).map((action) => (
                        <li key={action.id} className="rounded-xl bg-amber-50 p-3">
                          <p className="font-medium text-amber-950">{action.title}</p>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <StatusBadge status="Concluída pelo cliente" kind="custom" />
                            <Link href={`/gestor/planos/${action.planId}`} className="text-xs font-semibold text-primary">
                              Validar
                            </Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
