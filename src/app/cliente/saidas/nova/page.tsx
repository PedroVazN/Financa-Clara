import Link from "next/link";
import { createExpense } from "@/actions/expenses";
import { ExpenseForm } from "@/components/forms/expense-form";
import { Button } from "@/components/ui-legacy/button";
import { Card, PageHeader } from "@/components/ui-legacy/card";

export default function NovaSaidaPage() {
  return (
    <div>
      <PageHeader
        title="Nova saída"
        description="Cadastre um gasto para manter seu acompanhamento atualizado."
        actions={
          <Link href="/cliente/saidas">
            <Button variant="outline">Voltar</Button>
          </Link>
        }
      />
      <Card>
        <ExpenseForm action={createExpense} />
      </Card>
    </div>
  );
}
