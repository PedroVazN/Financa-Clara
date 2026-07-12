import { CompleteActionItemButton } from "@/components/client/complete-action-item-button";
import { Card, EmptyState, PageHeader } from "@/components/ui-legacy/card";
import { StatusBadge } from "@/components/ui-legacy/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  ACTION_CATEGORY_LABELS,
  ACTION_STATUS_LABELS,
  PLAN_STATUS_LABELS,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { getClientContext } from "@/lib/session";

export default async function PlanoPage() {
  const { clientId } = await getClientContext();
  const plan = await prisma.actionPlan.findFirst({
    where: { clientId, deletedAt: null, status: { not: "CONCLUIDO" } },
    include: {
      items: {
        where: { deletedAt: null },
        include: { validation: true },
        orderBy: { dueDate: "asc" },
      },
      manager: { include: { user: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!plan) {
    return (
      <div>
        <PageHeader
          title="Plano de ação"
          description="Seu gestor pode criar um plano com os próximos passos."
        />
        <EmptyState
          title="Nenhum plano ativo no momento"
          description="Quando um plano for criado, você verá as ações e prazos por aqui."
        />
      </div>
    );
  }

  const completed = plan.items.filter((item) => item.status === "CONCLUIDA").length;
  const progress = plan.items.length ? Math.round((completed / plan.items.length) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Plano de ação"
        description="Acompanhe as ações combinadas com seu gestor e conclua cada etapa."
      />

      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">{plan.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{plan.objective}</p>
            {plan.description ? (
              <p className="mt-3 text-sm text-muted-foreground">{plan.description}</p>
            ) : null}
            <p className="mt-3 text-xs text-muted-foreground">
              Gestor: {plan.manager.user.name} · de {formatDate(plan.startDate)} até{" "}
              {formatDate(plan.dueDate)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <StatusBadge status={plan.priority} kind="priority" />
            <span className="rounded-full border border-border bg-accent px-2.5 py-1 text-xs font-semibold text-foreground">
              {PLAN_STATUS_LABELS[plan.status]}
            </span>
          </div>
        </div>
        <div className="mt-5">
          <div className="mb-2 flex justify-between text-sm text-muted-foreground">
            <span>{completed}/{plan.items.length} ações concluídas</span>
            <span>{progress}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {plan.items.map((item) => {
          const isCompleted = item.status === "CONCLUIDA";
          const isValidated = Boolean(item.validation?.approved);

          return (
            <Card key={item.id} className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  {item.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  ) : null}
                  <p className="mt-2 text-sm text-muted-foreground">
                    {ACTION_CATEGORY_LABELS[item.category]} · prazo {formatDate(item.dueDate)}
                  </p>
                  {item.relatedItemLabel || item.relatedAmount ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Relacionado: {item.relatedItemLabel ?? "Item financeiro"}
                      {item.relatedAmount ? ` · ${formatCurrency(item.relatedAmount)}` : ""}
                    </p>
                  ) : null}
                  {item.guidance ? (
                    <p className="mt-3 rounded-xl bg-accent p-3 text-sm text-foreground">
                      {item.guidance}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <StatusBadge status={item.priority} kind="priority" />
                  <span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground">
                    {ACTION_STATUS_LABELS[item.status]}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-xl bg-muted p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  <p>
                    Concluída por você:{" "}
                    <strong className="text-foreground">
                      {item.completedByClient ? "Sim" : "Ainda não"}
                    </strong>
                  </p>
                  <p>
                    Validada pelo gestor:{" "}
                    <strong className="text-foreground">
                      {isValidated ? "Sim" : "Aguardando validação"}
                    </strong>
                  </p>
                </div>
                {!isCompleted ? <CompleteActionItemButton itemId={item.id} /> : null}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
