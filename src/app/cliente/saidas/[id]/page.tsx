import Link from "next/link";
import { notFound } from "next/navigation";
import { updateExpense } from "@/actions/expenses";
import { ExpenseForm } from "@/components/forms/expense-form";
import { Button } from "@/components/ui-legacy/button";
import { Card, PageHeader } from "@/components/ui-legacy/card";
import { prisma } from "@/lib/prisma";
import { getClientContext } from "@/lib/session";

export default async function EditarSaidaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { clientId } = await getClientContext();
  const expense = await prisma.expense.findFirst({
    where: { id, clientId, deletedAt: null },
  });
  if (!expense) notFound();

  const action = updateExpense.bind(null, id);

  return (
    <div>
      <PageHeader
        title="Editar saída"
        description="Atualize os dados deste gasto."
        actions={
          <Link href="/cliente/saidas">
            <Button variant="outline">Voltar</Button>
          </Link>
        }
      />
      <Card>
        <ExpenseForm expense={expense} action={action} />
      </Card>
    </div>
  );
}
