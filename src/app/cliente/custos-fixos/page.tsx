import Link from "next/link";
import { getClientContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { RECURRENCE_LABELS } from "@/lib/labels";
import { Card, EmptyState, PageHeader } from "@/components/ui-legacy/card";
import { Button } from "@/components/ui-legacy/button";
import { StatusBadge } from "@/components/ui-legacy/status-badge";
import { FixedCostActions } from "@/components/client/fixed-cost-actions";

export default async function CustosFixosPage({
  searchParams,
}: {
  searchParams: Promise<{ situacao?: string }>;
}) {
  const { clientId } = await getClientContext();
  const params = await searchParams;

  const fixedCosts = await prisma.fixedCost.findMany({
    where: {
      clientId,
      deletedAt: null,
      ...(params.situacao ? { financialStatus: params.situacao as never } : {}),
    },
    orderBy: [{ nextDueDate: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Custos fixos"
        description="Acompanhe contas recorrentes e próximos vencimentos."
        actions={
          <Link href="/cliente/custos-fixos/nova">
            <Button>Novo custo fixo</Button>
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
            <option value="PAGO">Pago</option>
            <option value="PENDENTE">Pendente</option>
          </select>
          <Button type="submit" variant="secondary">
            Filtrar
          </Button>
        </form>
      </Card>

      {fixedCosts.length === 0 ? (
        <EmptyState
          title="Você ainda não cadastrou nenhum custo fixo"
          description="Registre aluguel, energia, internet e outros compromissos recorrentes."
          action={
            <Link href="/cliente/custos-fixos/nova">
              <Button>Cadastrar primeiro custo fixo</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {fixedCosts.map((fixedCost) => (
            <Card key={fixedCost.id} className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {fixedCost.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {fixedCost.category} · {RECURRENCE_LABELS[fixedCost.frequency]} · dia{" "}
                    {fixedCost.dueDay}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Próximo vencimento: {formatDate(fixedCost.nextDueDate)}
                  </p>
                  {fixedCost.paymentMethod ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Pagamento: {fixedCost.paymentMethod}
                    </p>
                  ) : null}
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xl font-bold text-foreground">
                    {formatCurrency(fixedCost.amount)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 sm:justify-end">
                    <StatusBadge status={fixedCost.financialStatus} />
                    <StatusBadge status={fixedCost.approvalStatus} kind="approval" />
                  </div>
                </div>
              </div>
              <FixedCostActions id={fixedCost.id} status={fixedCost.financialStatus} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
