import { Building2, Mail, Users } from "lucide-react";
import { getManagerContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { Card, PageHeader, StatCard } from "@/components/ui-legacy/card";

export default async function GestorPerfilPage() {
  const { managerId } = await getManagerContext();
  const manager = await prisma.managerProfile.findUniqueOrThrow({
    where: { id: managerId },
    include: {
      user: true,
      clients: { include: { client: { include: { user: true } } } },
      plans: { where: { deletedAt: null } },
    },
  });

  const activePlans = manager.plans.filter((plan) => plan.status !== "CONCLUIDO").length;

  return (
    <div>
      <PageHeader
        title="Perfil do gestor"
        description="Informações da sua conta e resumo dos vínculos ativos."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Clientes vinculados" value={String(manager.clients.length)} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Planos ativos" value={String(activePlans)} />
        <StatCard title="Desde" value={formatDate(manager.createdAt)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Dados da conta</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Nome</dt>
              <dd className="mt-1 font-semibold text-foreground">{manager.user.name}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Mail className="h-4 w-4" />
                E-mail
              </dt>
              <dd className="mt-1 font-semibold text-foreground">{manager.user.email}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Empresa
              </dt>
              <dd className="mt-1 font-semibold text-foreground">{manager.company ?? "Não informada"}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Clientes vinculados</h2>
          {manager.clients.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum cliente vinculado ao seu perfil ainda.</p>
          ) : (
            <ul className="space-y-3">
              {manager.clients.slice(0, 10).map((relationship) => (
                <li key={relationship.id} className="rounded-xl border border-border p-3">
                  <p className="font-medium text-foreground">{relationship.client.user.name}</p>
                  <p className="text-xs text-muted-foreground">Vinculado em {formatDate(relationship.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
