import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClientAccount } from "@/actions/clients";
import { CreateClientForm } from "@/components/forms/create-client-form";
import { Button } from "@/components/ui-legacy/button";
import { Card, PageHeader } from "@/components/ui-legacy/card";
import { getManagerContext } from "@/lib/session";

export default async function NovoClientePage() {
  await getManagerContext();

  return (
    <div>
      <PageHeader
        title="Novo cliente"
        description="Crie o login de acesso do cliente e vincule-o ao seu perfil de gestor."
        actions={
          <Link href="/gestor/clientes">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        }
      />

      <Card>
        <CreateClientForm action={createClientAccount} />
      </Card>
    </div>
  );
}
