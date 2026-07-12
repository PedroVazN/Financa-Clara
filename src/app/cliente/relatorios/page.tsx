import { endOfMonth, startOfMonth } from "date-fns";
import { getClientContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { Card, EmptyState, PageHeader, StatCard } from "@/components/ui-legacy/card";
import { StatusBadge } from "@/components/ui-legacy/status-badge";

function sumByCategory<T extends { category: string; amount: number }>(items: T[]) {
  return Object.entries(
    items.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + item.amount;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
}

function barWidth(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.round((value / max) * 100);
}

export default async function ClienteRelatoriosPage() {
  const { clientId } = await getClientContext();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [incomes, expenses, fixedCosts, debts] = await Promise.all([
    prisma.income.findMany({
      where: { clientId, deletedAt: null, receivedAt: { gte: monthStart, lte: monthEnd } },
      orderBy: { receivedAt: "desc" },
    }),
    prisma.expense.findMany({
      where: { clientId, deletedAt: null, date: { gte: monthStart, lte: monthEnd } },
      orderBy: { date: "desc" },
    }),
    prisma.fixedCost.findMany({ where: { clientId, deletedAt: null }, orderBy: { nextDueDate: "asc" } }),
    prisma.debt.findMany({ where: { clientId, deletedAt: null }, orderBy: { dueDate: "asc" } }),
  ]);

  const totalIncomes = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalFixed = fixedCosts.reduce((sum, cost) => sum + cost.amount, 0);
  const openDebtTotal = debts
    .filter((debt) => ["EM_ABERTO", "EM_NEGOCIACAO", "RENEGOCIADO", "PENDENTE"].includes(debt.financialStatus))
    .reduce((sum, debt) => sum + debt.openBalance, 0);
  const incomeCategories = sumByCategory(incomes);
  const expenseCategories = sumByCategory(expenses);
  const maxIncome = Math.max(...incomeCategories.map(([, value]) => value), 0);
  const maxExpense = Math.max(...expenseCategories.map(([, value]) => value), 0);

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description="Resumo simples do mês atual para entender entradas, saídas e dívidas."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Entradas do mês" value={formatCurrency(totalIncomes)} />
        <StatCard title="Saídas do mês" value={formatCurrency(totalExpenses)} />
        <StatCard title="Custos fixos" value={formatCurrency(totalFixed)} />
        <StatCard title="Dívidas abertas" value={formatCurrency(openDebtTotal)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Entradas por categoria</h2>
          {incomeCategories.length === 0 ? (
            <EmptyState title="Sem entradas no período" description="Cadastre entradas para acompanhar a composição do mês." />
          ) : (
            <ul className="space-y-4">
              {incomeCategories.map(([category, value]) => (
                <li key={category}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-foreground">{category}</span>
                    <span>{formatCurrency(value)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${barWidth(value, maxIncome)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Saídas por categoria</h2>
          {expenseCategories.length === 0 ? (
            <EmptyState title="Sem saídas no período" description="Cadastre saídas para acompanhar os maiores grupos de gasto." />
          ) : (
            <ul className="space-y-4">
              {expenseCategories.map(([category, value]) => (
                <li key={category}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-foreground">{category}</span>
                    <span>{formatCurrency(value)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-rose-500" style={{ width: `${barWidth(value, maxExpense)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Dívidas em acompanhamento</h2>
        {debts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma dívida cadastrada.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {debts.map((debt) => (
              <div key={debt.id} className="rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{debt.name}</p>
                    <p className="text-xs text-muted-foreground">{debt.creditor}</p>
                  </div>
                  <StatusBadge status={debt.financialStatus} />
                </div>
                <p className="mt-2 text-sm text-foreground">{formatCurrency(debt.openBalance)} em aberto</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
