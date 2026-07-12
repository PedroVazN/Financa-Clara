"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  Bell,
  CreditCard,
  Home,
  LogOut,
  PiggyBank,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  User,
  Users,
  ClipboardList,
  AlertCircle,
  BarChart3,
  LayoutDashboard,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const clientNav: NavItem[] = [
  { href: "/cliente", label: "Início", icon: Home },
  { href: "/cliente/entradas", label: "Entradas", icon: TrendingUp },
  { href: "/cliente/custos-fixos", label: "Custos fixos", icon: CreditCard },
  { href: "/cliente/saidas", label: "Saídas", icon: TrendingDown },
  { href: "/cliente/dividas", label: "Dívidas", icon: PiggyBank },
  { href: "/cliente/plano", label: "Plano de ação", icon: Target },
  { href: "/cliente/progresso", label: "Meu progresso", icon: Trophy },
  { href: "/cliente/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/cliente/notificacoes", label: "Notificações", icon: Bell },
  { href: "/cliente/perfil", label: "Perfil", icon: User },
];

const managerNav: NavItem[] = [
  { href: "/gestor", label: "Visão geral", icon: LayoutDashboard },
  { href: "/gestor/clientes", label: "Clientes", icon: Users },
  { href: "/gestor/planos", label: "Planos de ação", icon: ClipboardList },
  { href: "/gestor/pendencias", label: "Pendências", icon: AlertCircle },
  { href: "/gestor/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/gestor/notificacoes", label: "Notificações", icon: Bell },
  { href: "/gestor/perfil", label: "Perfil", icon: User },
];

export function AppShell({
  role,
  userName,
  unreadCount = 0,
  children,
}: {
  role: "CLIENT" | "MANAGER";
  userName: string;
  unreadCount?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const items = role === "CLIENT" ? clientNav : managerNav;
  const brand = role === "CLIENT" ? "Meu espaço" : "Painel gestor";

  const isActive = (href: string) =>
    href === "/cliente" || href === "/gestor"
      ? pathname === href
      : pathname.startsWith(href);

  return (
    <div className="min-h-screen">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2"
      >
        Ir para o conteúdo
      </a>

      <aside className="glass-strong fixed inset-y-0 left-0 z-30 hidden w-64 flex-col px-3 py-6 lg:flex">
        <div className="clareira-glow mb-6 px-3">
          <p className="font-display text-xl font-bold text-foreground dark:text-foreground">
            Finança Clara
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{brand}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Olá, {userName.split(" ")[0]}
          </p>
        </div>

        <nav className="flex flex-1 flex-col gap-1" aria-label="Menu principal">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium transition-colors",
                  active
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-2xl bg-primary shadow-sm dark:bg-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                ) : null}
                <Icon className="relative z-10 size-5 shrink-0" aria-hidden />
                <span className="relative z-10 flex-1">{item.label}</span>
                {item.label === "Notificações" && unreadCount > 0 ? (
                  <Badge className="relative z-10 border-0 bg-clay text-[#1a2e28] hover:bg-clay">
                    {unreadCount}
                  </Badge>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <Separator className="my-3" />

        <div className="flex items-center gap-1 px-1">
          <ThemeToggle />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="flex-1 justify-start gap-2"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="size-4" aria-hidden />
                Sair
              </Button>
            </TooltipTrigger>
            <TooltipContent>Encerrar sessão</TooltipContent>
          </Tooltip>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="glass sticky top-0 z-20 px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="clareira-glow">
              <p className="font-display text-lg font-bold text-foreground dark:text-foreground">
                Finança Clara
              </p>
              <p className="text-sm text-muted-foreground">{brand}</p>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Sair
              </Button>
            </div>
          </div>
        </header>

        <main id="conteudo" className="mx-auto max-w-6xl px-4 py-6 pb-28 lg:pb-10">
          <motion.div
            key={pathname}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      <nav
        className="glass-strong fixed inset-x-0 bottom-0 z-30 px-2 py-2 lg:hidden"
        aria-label="Navegação inferior"
      >
        <ul className="grid grid-cols-5 gap-1">
          {items.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-medium transition-colors",
                    active ? "bg-secondary text-primary dark:bg-accent dark:text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                  <span className="truncate">{item.label.split(" ")[0]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-1 grid grid-cols-4 gap-1">
          {items.slice(5).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-10 items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-medium",
                  active ? "bg-secondary text-primary dark:bg-accent dark:text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
