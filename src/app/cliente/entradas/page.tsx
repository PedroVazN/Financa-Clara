import Link from "next/link";
import { getClientContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { INCOME_TYPE_LABELS, RECURRENCE_LABELS } from "@/lib/labels";
import { PageHeader, EmptyState, Card } from "@/components/ui-legacy/card";
import { StatusBadge } from "@/components/ui-legacy/status-badge";
import { Button } from "@/components/ui-legacy/button";
import { IncomeActions } from "@/components/client/income-actions";

export default async function EntradasPage({
  searchParams,
}: {
  searchParams: Promise<{ situacao?: string; categoria?: string }>;
}) {
  const { clientId } = await getClientContext();
  const params = await searchParams;

  const incomes = await prisma.income.findMany({
    where: {
      clientId,
      deletedAt: null,
      ...(params.situacao ? { financialStatus: params.situacao as never } : {}),
      ...(params.categoria
        ? { category: { contains: params.categoria } }
        : {}),
    },
    orderBy: { receivedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Entradas"
        description="Registre o que você recebe para acompanhar sua organização."
        actions={
          <Link href="/cliente/entradas/nova">
            <Button>Nova entrada</Button>
          </Link>
        }
      />

      <Card className="mb-6">
        <form className="flex flex-col gap-3 sm:flex-row">
          <input
            name="categoria"
            placeholder="Filtrar por categoria"
            defaultValue={params.categoria}
            className="min-h-11 flex-1 rounded-xl border border-border px-3"
          />
          <select
            name="situacao"
            defaultValue={params.situacao || ""}
            className="min-h-11 rounded-xl border border-border px-3"
          >
            <option value="">Todas as situações</option>
            <option value="RECEBIDO">Recebido</option>
            <option value="PENDENTE">Pendente</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
          <Button type="submit" variant="secondary">
            Filtrar
          </Button>
        </form>
      </Card>

      {incomes.length === 0 ? (
        <EmptyState
          title="Você ainda não cadastrou nenhuma entrada"
          description="Comece registrando seu salário, benefício ou outra receita."
          action={
            <Link href="/cliente/entradas/nova">
              <Button>Cadastrar primeira entrada</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {incomes.map((income) => (
            <Card key={income.id} className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {income.description}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {income.category} · {INCOME_TYPE_LABELS[income.incomeType]} ·{" "}
                    {RECURRENCE_LABELS[income.recurrence]}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Recebimento: {formatDate(income.receivedAt)}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xl font-bold text-foreground">
                    {formatCurrency(income.amount)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 sm:justify-end">
                    <StatusBadge status={income.financialStatus} />
                    <StatusBadge status={income.approvalStatus} kind="approval" />
                  </div>
                </div>
              </div>
              <IncomeActions id={income.id} status={income.financialStatus} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
