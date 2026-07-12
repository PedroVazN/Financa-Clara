import Link from "next/link";
import { createDebt } from "@/actions/debts";
import { DebtForm } from "@/components/forms/debt-form";
import { Button } from "@/components/ui-legacy/button";
import { Card, PageHeader } from "@/components/ui-legacy/card";

export default function NovaDividaPage() {
  return (
    <div>
      <PageHeader
        title="Nova dívida"
        description="Cadastre os dados principais para acompanhar a negociação."
        actions={
          <Link href="/cliente/dividas">
            <Button variant="outline">Voltar</Button>
          </Link>
        }
      />
      <Card>
        <DebtForm action={createDebt} />
      </Card>
    </div>
  );
}
