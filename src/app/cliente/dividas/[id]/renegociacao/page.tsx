import Link from "next/link";
import { notFound } from "next/navigation";
import { createRenegotiation } from "@/actions/debts";
import { RenegotiationForm } from "@/components/forms/renegotiation-form";
import { Button } from "@/components/ui-legacy/button";
import { Card, PageHeader } from "@/components/ui-legacy/card";
import { prisma } from "@/lib/prisma";
import { getClientContext } from "@/lib/session";

export default async function NovaRenegociacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: debtId } = await params;
  const { clientId } = await getClientContext();
  const debt = await prisma.debt.findFirst({
    where: { id: debtId, clientId, deletedAt: null },
  });
  if (!debt) notFound();

  const action = createRenegotiation.bind(null, debtId);

  return (
    <div>
      <PageHeader
        title="Registrar renegociação"
        description={`Informe manualmente os dados do acordo para ${debt.name}.`}
        actions={
          <Link href={`/cliente/dividas/${debtId}`}>
            <Button variant="outline">Voltar</Button>
          </Link>
        }
      />
      <Card>
        <RenegotiationForm debtId={debtId} action={action} />
      </Card>
    </div>
  );
}
