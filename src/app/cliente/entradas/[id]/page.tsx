import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { updateIncome } from "@/actions/incomes";
import { IncomeForm } from "@/components/forms/income-form";
import { PageHeader, Card } from "@/components/ui-legacy/card";
import { Button } from "@/components/ui-legacy/button";

export default async function EditarEntradaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { clientId } = await getClientContext();
  const income = await prisma.income.findFirst({
    where: { id, clientId, deletedAt: null },
  });
  if (!income) notFound();
  const action = updateIncome.bind(null, id);

  return (
    <div>
      <PageHeader
        title="Editar entrada"
        description="Atualize os dados desta entrada."
        actions={
          <Link href="/cliente/entradas">
            <Button variant="outline">Voltar</Button>
          </Link>
        }
      />
      <Card>
        <IncomeForm income={income} action={action} />
      </Card>
    </div>
  );
}
