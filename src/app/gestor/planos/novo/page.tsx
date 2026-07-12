import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createActionPlan } from "@/actions/action-plans";
import { assertManagerOwnsClient, getManagerContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ActionPlanForm } from "@/components/forms/action-plan-form";
import { Button } from "@/components/ui-legacy/button";
import { Card, EmptyState, PageHeader } from "@/components/ui-legacy/card";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function NovoPlanoPage({ searchParams }: { searchParams: SearchParams }) {
  const { managerId } = await getManagerContext();
  const params = await searchParams;
  const clientId = getParam(params, "clientId");

  if (!clientId) {
    return (
      <div>
        <PageHeader title="Novo plano" description="Escolha um cliente antes de criar um plano." />
        <EmptyState
          title="Cliente não informado"
          description="A criação de plano precisa receber um cliente vinculado."
          action={
            <Link href="/gestor/clientes">
              <Button>Escolher cliente</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const selectedClientId = clientId;

  await assertManagerOwnsClient(managerId, selectedClientId);
  const client = await prisma.clientProfile.findFirst({
    where: { id: selectedClientId, deletedAt: null, managers: { some: { managerId } } },
    include: { user: true },
  });
  if (!client) notFound();

  async function createForClient(formData: FormData) {
    "use server";
    return createActionPlan(selectedClientId, formData);
  }

  return (
    <div>
      <PageHeader
        title="Novo plano de ação"
        description={`Crie um plano para ${client.user.name}.`}
        actions={
          <Link href={`/gestor/clientes/${client.id}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao cliente
            </Button>
          </Link>
        }
      />
      <Card>
        <ActionPlanForm action={createForClient} />
      </Card>
    </div>
  );
}
