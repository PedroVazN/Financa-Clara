import Link from "next/link";
import { ExpenseActions } from "@/components/client/expense-actions";
import { Button } from "@/components/ui-legacy/button";
import { Card, EmptyState, PageHeader } from "@/components/ui-legacy/card";
import { StatusBadge } from "@/components/ui-legacy/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { RECURRENCE_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { getClientContext } from "@/lib/session";

export default async function SaidasPage({
  searchParams,
}: {
  searchParams: Promise<{ situacao?: string; categoria?: string }>;
}) {
  const { clientId } = await getClientContext();
  const params = await searchParams;

  const expenses = await prisma.expense.findMany({
    where: {
      clientId,
      deletedAt: null,
      ...(params.situacao ? { financialStatus: params.situacao as never } : {}),
      ...(params.categoria ? { category: { contains: params.categoria } } : {}),
    },
    orderBy: { date: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Saídas"
        description="Registre seus gastos para entender para onde o dinheiro está indo."
        actions={
          <Link href="/cliente/saidas/nova">
            <Button>Nova saída</Button>
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
            <option value="PAGO">Pago</option>
            <option value="PENDENTE">Pendente</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
          <Button type="submit" variant="secondary">
            Filtrar
          </Button>
        </form>
      </Card>

      {expenses.length === 0 ? (
        <EmptyState
          title="Você ainda não cadastrou nenhuma saída"
          description="Inclua seus gastos para acompanhar o saldo e organizar prioridades."
          action={
            <Link href="/cliente/saidas/nova">
              <Button>Cadastrar primeira saída</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <Card key={expense.id} className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {expense.description}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {expense.category} · {RECURRENCE_LABELS[expense.recurrence]}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Data: {formatDate(expense.date)}
                  </p>
                  {expense.paymentMethod ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Pagamento: {expense.paymentMethod}
                    </p>
                  ) : null}
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xl font-bold text-foreground">
                    {formatCurrency(expense.amount)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 sm:justify-end">
                    <StatusBadge status={expense.financialStatus} />
                    <StatusBadge status={expense.approvalStatus} kind="approval" />
                  </div>
                </div>
              </div>
              <ExpenseActions id={expense.id} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
