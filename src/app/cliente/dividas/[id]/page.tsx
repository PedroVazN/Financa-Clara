import Link from "next/link";
import { notFound } from "next/navigation";
import { markRenegotiationPaymentPaid } from "@/actions/debts";
import { Button } from "@/components/ui-legacy/button";
import { Card, EmptyState, PageHeader } from "@/components/ui-legacy/card";
import { StatusBadge } from "@/components/ui-legacy/status-badge";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import {
  CHANNEL_LABELS,
  RECURRENCE_LABELS,
  RENEGOTIATION_STATUS_LABELS,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { getClientContext } from "@/lib/session";

const auditActionLabels: Record<string, string> = {
  CREATE: "Criado",
  UPDATE: "Atualizado",
  DELETE: "Excluído",
  STATUS_CHANGE: "Status alterado",
};

export default async function DetalheDividaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { clientId } = await getClientContext();

  const [debt, history] = await Promise.all([
    prisma.debt.findFirst({
      where: { id, clientId, deletedAt: null },
      include: {
        renegotiations: {
          where: { deletedAt: null },
          include: { payments: { orderBy: { dueDate: "asc" } } },
          orderBy: { renegotiatedAt: "desc" },
        },
      },
    }),
    prisma.auditLog.findMany({
      where: { entityType: "Debt", entityId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  if (!debt) notFound();

  const payments = debt.renegotiations.flatMap((renegotiation) =>
    renegotiation.payments.map((payment) => ({
      ...payment,
      renegotiation,
    })),
  );

  return (
    <div>
      <PageHeader
        title={debt.name}
        description={`${debt.creditor} · ${debt.category}`}
        actions={
          <>
            <Link href="/cliente/dividas">
              <Button variant="outline">Voltar</Button>
            </Link>
            <Link href={`/cliente/dividas/${debt.id}/renegociacao`}>
              <Button>Registrar renegociação</Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Resumo da dívida</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Contratada em {formatDate(debt.contractedAt)} e com vencimento em{" "}
                {formatDate(debt.dueDate)}.
              </p>
              {debt.notes ? (
                <p className="mt-3 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                  {debt.notes}
                </p>
              ) : null}
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Saldo em aberto
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(debt.openBalance)}
              </p>
              <p className="text-sm text-muted-foreground">
                Original: {formatCurrency(debt.originalAmount)}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-accent p-3">
              <p className="text-xs font-medium text-foreground">Parcelas</p>
              <p className="mt-1 font-semibold text-foreground">
                {debt.installmentCount ?? "Não informado"}
              </p>
            </div>
            <div className="rounded-xl bg-accent p-3">
              <p className="text-xs font-medium text-foreground">Valor da parcela</p>
              <p className="mt-1 font-semibold text-foreground">
                {debt.installmentValue ? formatCurrency(debt.installmentValue) : "Não informado"}
              </p>
            </div>
            <div className="rounded-xl bg-accent p-3">
              <p className="text-xs font-medium text-foreground">Frequência</p>
              <p className="mt-1 font-semibold text-foreground">
                {RECURRENCE_LABELS[debt.frequency]}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-foreground">Status</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={debt.financialStatus} />
            <StatusBadge status={debt.approvalStatus} kind="approval" />
            <StatusBadge status={debt.priority} kind="priority" />
          </div>
          <Link href={`/cliente/dividas/${debt.id}/renegociacao`} className="mt-5 block">
            <Button className="w-full">Registrar renegociação</Button>
          </Link>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Renegociações</h2>
          {debt.renegotiations.length === 0 ? (
            <EmptyState
              title="Nenhuma renegociação registrada"
              description="Quando houver um acordo, registre os dados para acompanhar os pagamentos."
              action={
                <Link href={`/cliente/dividas/${debt.id}/renegociacao`}>
                  <Button>Registrar renegociação</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {debt.renegotiations.map((renegotiation) => (
                <div
                  key={renegotiation.id}
                  className="rounded-xl border border-border bg-muted/70 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-foreground">
                        {RENEGOTIATION_STATUS_LABELS[renegotiation.status]}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(renegotiation.renegotiatedAt)} ·{" "}
                        {CHANNEL_LABELS[renegotiation.channel]}
                      </p>
                    </div>
                    <p className="font-bold text-foreground">
                      {formatCurrency(renegotiation.totalAmount)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {renegotiation.agreementDesc}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {renegotiation.paymentCount} pagamento(s) de{" "}
                    {formatCurrency(renegotiation.paymentAmount)} · primeiro em{" "}
                    {formatDate(renegotiation.firstPaymentDate)}
                  </p>
                  {renegotiation.protocolNumber ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Protocolo: {renegotiation.protocolNumber}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Pagamentos</h2>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Os pagamentos aparecerão aqui após registrar uma renegociação.
            </p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col gap-3 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-foreground">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Vence em {formatDate(payment.dueDate)}
                    </p>
                    {payment.paidAt ? (
                      <p className="text-xs text-muted-foreground">
                        Pago em {formatDate(payment.paidAt)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={payment.financialStatus} />
                    {payment.financialStatus !== "PAGO" ? (
                      <form
                        action={async () => {
                          "use server";
                          await markRenegotiationPaymentPaid(payment.id, debt.id);
                        }}
                      >
                        <Button type="submit" variant="secondary">
                          Marcar pago
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Histórico</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ainda não há histórico registrado para esta dívida.
          </p>
        ) : (
          <ol className="space-y-3">
            {history.map((log) => (
              <li key={log.id} className="rounded-xl border border-border bg-muted p-3">
                <p className="font-medium text-foreground">
                  {auditActionLabels[log.action] ?? log.action}
                </p>
                <p className="text-sm text-muted-foreground">{formatDateTime(log.createdAt)}</p>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
