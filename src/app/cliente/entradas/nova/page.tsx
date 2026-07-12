import Link from "next/link";
import { createIncome } from "@/actions/incomes";
import { IncomeForm } from "@/components/forms/income-form";
import { PageHeader, Card } from "@/components/ui-legacy/card";
import { Button } from "@/components/ui-legacy/button";

export default function NovaEntradaPage() {
  return (
    <div>
      <PageHeader
        title="Nova entrada"
        description="Cadastre um recebimento de forma simples."
        actions={
          <Link href="/cliente/entradas">
            <Button variant="outline">Voltar</Button>
          </Link>
        }
      />
      <Card>
        <IncomeForm action={createIncome} />
      </Card>
    </div>
  );
}
