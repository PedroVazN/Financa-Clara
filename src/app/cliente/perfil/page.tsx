import Link from "next/link";
import { Button } from "@/components/ui-legacy/button";
import { Card, PageHeader } from "@/components/ui-legacy/card";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getClientContext } from "@/lib/session";

export default async function PerfilPage() {
  const { clientId, session } = await getClientContext();
  const profile = await prisma.clientProfile.findUnique({
    where: { id: clientId },
    include: {
      user: true,
      managers: {
        include: { manager: { include: { user: true } } },
      },
    },
  });

  return (
    <div>
      <PageHeader
        title="Perfil"
        description="Confira os dados básicos da sua conta."
        actions={
          <Link href="/cliente">
            <Button variant="outline">Voltar ao painel</Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">Dados pessoais</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-muted p-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Nome
              </dt>
              <dd className="mt-1 font-semibold text-foreground">
                {profile?.user.name ?? session.user.name}
              </dd>
            </div>
            <div className="rounded-xl bg-muted p-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                E-mail
              </dt>
              <dd className="mt-1 font-semibold text-foreground">
                {profile?.user.email ?? session.user.email}
              </dd>
            </div>
            <div className="rounded-xl bg-muted p-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Telefone
              </dt>
              <dd className="mt-1 font-semibold text-foreground">
                {profile?.phone || "Não informado"}
              </dd>
            </div>
            <div className="rounded-xl bg-muted p-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Cidade
              </dt>
              <dd className="mt-1 font-semibold text-foreground">
                {profile?.city || "Não informada"}
              </dd>
            </div>
            <div className="rounded-xl bg-muted p-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Cliente desde
              </dt>
              <dd className="mt-1 font-semibold text-foreground">
                {formatDate(profile?.createdAt)}
              </dd>
            </div>
            <div className="rounded-xl bg-muted p-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Perfil
              </dt>
              <dd className="mt-1 font-semibold text-foreground">Cliente</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-foreground">Gestor vinculado</h2>
          {profile?.managers.length ? (
            <div className="mt-4 space-y-3">
              {profile.managers.map((link) => (
                <div key={link.id} className="rounded-xl border border-border p-3">
                  <p className="font-semibold text-foreground">
                    {link.manager.user.name}
                  </p>
                  <p className="text-sm text-muted-foreground">{link.manager.user.email}</p>
                  {link.manager.company ? (
                    <p className="mt-1 text-sm text-muted-foreground">{link.manager.company}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Você ainda não tem um gestor vinculado.
            </p>
          )}
        </Card>
      </div>

      <Card className="mt-6 border-border bg-accent/60">
        <h2 className="text-lg font-semibold text-foreground">Sobre sair da conta</h2>
        <p className="mt-2 text-sm text-foreground">
          Para encerrar sua sessão com segurança, use o botão "Sair" no menu lateral
          ou no topo da versão mobile. Você será redirecionado para a tela de login.
        </p>
      </Card>
    </div>
  );
}
