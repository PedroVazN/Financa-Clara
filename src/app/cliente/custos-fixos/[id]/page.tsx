import Link from "next/link";
import { notFound } from "next/navigation";
import { updateFixedCost } from "@/actions/fixed-costs";
import { FixedCostForm } from "@/components/forms/fixed-cost-form";
import { Button } from "@/components/ui-legacy/button";
import { Card, PageHeader } from "@/components/ui-legacy/card";
import { prisma } from "@/lib/prisma";
import { getClientContext } from "@/lib/session";

export default async function EditarCustoFixoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { clientId } = await getClientContext();
  const fixedCost = await prisma.fixedCost.findFirst({
    where: { id, clientId, deletedAt: null },
  });
  if (!fixedCost) notFound();

  const action = updateFixedCost.bind(null, id);

  return (
    <div>
      <PageHeader
        title="Editar custo fixo"
        description="Atualize os dados deste custo recorrente."
        actions={
          <Link href="/cliente/custos-fixos">
            <Button variant="outline">Voltar</Button>
          </Link>
        }
      />
      <Card>
        <FixedCostForm fixedCost={fixedCost} action={action} />
      </Card>
    </div>
  );
}
