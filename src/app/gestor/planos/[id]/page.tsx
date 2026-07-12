import Link from "next/link";
import { notFound } from "next/navigation";
import { isBefore } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { addActionItem, updateActionPlan } from "@/actions/action-plans";
import { getManagerContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  ACTION_CATEGORY_LABELS,
  ACTION_STATUS_LABELS,
  PLAN_STATUS_LABELS,
} from "@/lib/labels";
import { ActionItemForm } from "@/components/forms/action-item-form";
import { ActionPlanForm } from "@/components/forms/action-plan-form";
import { ValidateActionButton } from "@/components/manager/validate-action-button";
import { Button } from "@/components/ui-legacy/button";
import { Card, EmptyState, PageHeader } from "@/components/ui-legacy/card";
import { StatusBadge } from "@/components/ui-legacy/status-badge";

type Params = Promise<{ id: string }>;

export default async function GestorPlanoDetalhePage({ params }: { params: Params }) {
  const { id } = await params;
  const { managerId } = await getManagerContext();
  const plan = await prisma.actionPlan.findFirst({
    where: {
      id,
      managerId,
      deletedAt: null,
      client: { managers: { some: { managerId } } },
    },
    include: {
      client: { include: { user: true } },
      items: {
        where: { deletedAt: null },
        include: { validation: true },
        orderBy: { dueDate: "asc" },
      },
    },
  });

  if (!plan) notFound();

  async function updateCurrentPlan(formData: FormData) {
    "use server";
    return updateActionPlan(id, formData);
  }

  async function addItemToPlan(formData: FormData) {
    "use server";
    return addActionItem(id, formData);
  }

  const completedItems = plan.items.filter((item) => item.status === "CONCLUIDA").length;
  const progress = plan.items.length ? Math.round((completedItems / plan.items.length) * 100) : 0;

  return (
    <div>
      <PageHeader
        title={plan.title}
        description={`Plano de ${plan.client.user.name}. O gestor edita orientações e valida ações concluídas pelo cliente.`}
        actions={
          <>
            <Link href="/gestor/planos">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <Link href={`/gestor/clientes/${plan.clientId}`}>
              <Button variant="secondary">Ver cliente</Button>
            </Link>
          </>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-sm font-medium text-muted-foreground">Status</p>
          <div className="mt-3">
            <StatusBadge status={PLAN_STATUS_LABELS[plan.status] ?? plan.status} kind="custom" />
          </div>
        </Card>
        <Card>
          <p className="text-sm font-medium text-muted-foreground">Prazo</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{formatDate(plan.dueDate)}</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-muted-foreground">Progresso</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{progress}%</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-muted-foreground">Ações para validar</p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {plan.items.filter((item) => item.completedByClient && item.validation == null).length}
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Editar plano</h2>
          <ActionPlanForm plan={plan} action={updateCurrentPlan} redirectTo={`/gestor/planos/${plan.id}`} />
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Adicionar ação</h2>
          <ActionItemForm action={addItemToPlan} />
        </Card>
      </div>

      <Card className="mt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Ações do plano</h2>
          <div className="min-w-48">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1 text-right text-xs text-muted-foreground">
              {completedItems}/{plan.items.length} concluídas
            </p>
          </div>
        </div>

        {plan.items.length === 0 ? (
          <EmptyState
            title="Nenhuma ação cadastrada"
            description="Adicione ações claras para o cliente executar e depois valide quando ele concluir."
          />
        ) : (
          <ul className="space-y-4">
            {plan.items.map((item) => {
              const delayed = item.status !== "CONCLUIDA" && isBefore(item.dueDate, new Date());
              return (
                <li key={item.id} className="rounded-2xl border border-border bg-muted/70 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">{item.title}</h3>
                        <StatusBadge status={ACTION_STATUS_LABELS[item.status] ?? item.status} kind="custom" />
                        <StatusBadge status={item.priority} kind="priority" />
                        {delayed ? (
                          <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-800">
                            Atrasada
                          </span>
                        ) : null}
                      </div>
                      {item.description ? <p className="mt-2 text-sm text-muted-foreground">{item.description}</p> : null}
                      <dl className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categoria</dt>
                          <dd>{ACTION_CATEGORY_LABELS[item.category] ?? item.category}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prazo</dt>
                          <dd>{formatDate(item.dueDate)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Referência</dt>
                          <dd>{item.relatedItemLabel ?? "Não informada"}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Valor relacionado</dt>
                          <dd>{item.relatedAmount ? formatCurrency(item.relatedAmount) : "Não informado"}</dd>
                        </div>
                      </dl>
                      {item.guidance ? (
                        <p className="mt-3 rounded-xl bg-card px-3 py-2 text-sm text-foreground">
                          {item.guidance}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                        {item.completedByClient ? (
                          <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-900">
                            Concluída pelo cliente{item.completedAt ? ` em ${formatDate(item.completedAt)}` : ""}
                          </span>
                        ) : (
                          <span className="rounded-full bg-muted px-2.5 py-1 text-foreground">
                            Aguardando conclusão do cliente
                          </span>
                        )}
                        {item.validation ? (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">
                            Validada pelo gestor em {formatDate(item.validation.validatedAt)}
                          </span>
                        ) : item.completedByClient ? (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-900">
                            Aguardando validação do gestor
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {item.completedByClient && item.validation == null ? (
                      <ValidateActionButton itemId={item.id} />
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
