import Link from "next/link";
import { createFixedCost } from "@/actions/fixed-costs";
import { FixedCostForm } from "@/components/forms/fixed-cost-form";
import { Button } from "@/components/ui-legacy/button";
import { Card, PageHeader } from "@/components/ui-legacy/card";

export default function NovoCustoFixoPage() {
  return (
    <div>
      <PageHeader
        title="Novo custo fixo"
        description="Cadastre uma conta recorrente para acompanhar vencimentos."
        actions={
          <Link href="/cliente/custos-fixos">
            <Button variant="outline">Voltar</Button>
          </Link>
        }
      />
      <Card>
        <FixedCostForm action={createFixedCost} />
      </Card>
    </div>
  );
}
