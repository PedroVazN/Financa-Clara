import Link from "next/link";
import { Plus } from "lucide-react";
import { getManagerContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { ACTION_STATUS_LABELS, PLAN_STATUS_LABELS } from "@/lib/labels";
import { Button } from "@/components/ui-legacy/button";
import { Card, EmptyState, PageHeader } from "@/components/ui-legacy/card";
import { StatusBadge } from "@/components/ui-legacy/status-badge";

function progress(items: { status: string }[]) {
  if (items.length === 0) return 0;
  return Math.round((items.filter((item) => item.status === "CONCLUIDA").length / items.length) * 100);
}

export default async function GestorPlanosPage() {
  const { managerId } = await getManagerContext();
  const plans = await prisma.actionPlan.findMany({
    where: {
      managerId,
      deletedAt: null,
      client: { managers: { some: { managerId } } },
    },
    include: {
      client: { include: { user: true } },
      items: { where: { deletedAt: null }, include: { validation: true }, orderBy: { dueDate: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Planos de ação"
        description="Todos os planos criados para clientes vinculados ao seu perfil."
        actions={
          <Link href="/gestor/clientes">
            <Button>
              <Plus className="h-4 w-4" />
              Novo plano
            </Button>
          </Link>
        }
      />

      {plans.length === 0 ? (
        <EmptyState
          title="Nenhum plano encontrado"
          description="Escolha um cliente e crie um plano para orientar as próximas ações."
          action={
            <Link href="/gestor/clientes">
              <Button>Ver clientes</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {plans.map((plan) => {
            const planProgress = progress(plan.items);
            const waitingValidation = plan.items.filter(
              (item) => item.completedByClient && item.validation == null,
            ).length;
            return (
              <Card key={plan.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{plan.client.user.name}</p>
                    <h2 className="mt-1 text-lg font-semibold text-foreground">{plan.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.objective}</p>
                  </div>
                  <StatusBadge status={PLAN_STATUS_LABELS[plan.status] ?? plan.status} kind="custom" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge status={plan.priority} kind="priority" />
                  <span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground">
                    Prazo: {formatDate(plan.dueDate)}
                  </span>
                  {waitingValidation > 0 ? (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900">
                      {waitingValidation} para validar
                    </span>
                  ) : null}
                </div>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>{plan.items.filter((item) => item.status === "CONCLUIDA").length}/{plan.items.length} ações</span>
                    <span>{planProgress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${planProgress}%` }} />
                  </div>
                </div>
                {plan.items.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {plan.items.slice(0, 3).map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted px-3 py-2">
                        <span className="text-sm font-medium text-foreground">{item.title}</span>
                        <StatusBadge status={ACTION_STATUS_LABELS[item.status] ?? item.status} kind="custom" />
                      </li>
                    ))}
                  </ul>
                ) : null}
                <Link href={`/gestor/planos/${plan.id}`} className="mt-4 inline-block text-sm font-semibold text-primary">
                  Abrir e editar plano
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
