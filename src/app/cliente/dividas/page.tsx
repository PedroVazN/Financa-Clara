import Link from "next/link";
import { Button } from "@/components/ui-legacy/button";
import { Card, EmptyState, PageHeader } from "@/components/ui-legacy/card";
import { StatusBadge } from "@/components/ui-legacy/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { RECURRENCE_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { getClientContext } from "@/lib/session";

export default async function DividasPage({
  searchParams,
}: {
  searchParams: Promise<{ situacao?: string; prioridade?: string }>;
}) {
  const { clientId } = await getClientContext();
  const params = await searchParams;

  const debts = await prisma.debt.findMany({
    where: {
      clientId,
      deletedAt: null,
      ...(params.situacao ? { financialStatus: params.situacao as never } : {}),
      ...(params.prioridade ? { priority: params.prioridade as never } : {}),
    },
    orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
  });

  return (
    <div>
      <PageHeader
        title="Dívidas"
        description="Acompanhe dívidas, saldos em aberto e renegociações."
        actions={
          <Link href="/cliente/dividas/nova">
            <Button>Nova dívida</Button>
          </Link>
        }
      />

      <Card className="mb-6">
        <form className="flex flex-col gap-3 sm:flex-row">
          <select
            name="situacao"
            defaultValue={params.situacao || ""}
            className="min-h-11 rounded-xl border border-border px-3"
          >
            <option value="">Todas as situações</option>
            <option value="EM_ABERTO">Em aberto</option>
            <option value="EM_NEGOCIACAO">Em negociação</option>
            <option value="RENEGOCIADO">Renegociado</option>
            <option value="PAGO">Pago</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
          <select
            name="prioridade"
            defaultValue={params.prioridade || ""}
            className="min-h-11 rounded-xl border border-border px-3"
          >
            <option value="">Todas as prioridades</option>
            <option value="BAIXA">Baixa</option>
            <option value="MEDIA">Média</option>
            <option value="ALTA">Alta</option>
            <option value="URGENTE">Urgente</option>
          </select>
          <Button type="submit" variant="secondary">
            Filtrar
          </Button>
        </form>
      </Card>

      {debts.length === 0 ? (
        <EmptyState
          title="Você ainda não cadastrou nenhuma dívida"
          description="Cadastre uma dívida para acompanhar saldo, vencimento e próximos acordos."
          action={
            <Link href="/cliente/dividas/nova">
              <Button>Cadastrar primeira dívida</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {debts.map((debt) => (
            <Link key={debt.id} href={`/cliente/dividas/${debt.id}`} className="block">
              <Card className="space-y-3 transition hover:border-border hover:bg-accent/30">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{debt.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {debt.creditor} · {debt.category} ·{" "}
                      {RECURRENCE_LABELS[debt.frequency]}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Vencimento: {formatDate(debt.dueDate)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Saldo em aberto
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {formatCurrency(debt.openBalance)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Original: {formatCurrency(debt.originalAmount)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={debt.financialStatus} />
                  <StatusBadge status={debt.approvalStatus} kind="approval" />
                  <StatusBadge status={debt.priority} kind="priority" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
