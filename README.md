# Finança Clara — MVP

Sistema web de **gestão financeira assistiva** com perfis Cliente e Gestor.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Prisma ORM + PostgreSQL (Neon)
- NextAuth (Auth.js) com credenciais
- Zod + Server Actions por domínio

## Como executar

Configure `DATABASE_URL` no `.env` (veja `.env.example`) e rode:

```bash
npm install
npm run db:setup
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Contas de demonstração

| Perfil  | E-mail           | Senha  |
|---------|------------------|--------|
| Gestor  | gestor@demo.com  | 123456 |

O gestor cria logins de cliente em **Clientes → Novo cliente** (`/gestor/clientes/novo`).

## Scripts úteis

- `npm run db:push` — aplica o schema no banco
- `npm run db:seed` — recarrega dados fictícios
- `npm run db:setup` — push + seed
- `npm run build` — build de produção

## Deploy (Vercel)

Variáveis de ambiente necessárias:

- `DATABASE_URL` — connection string do Neon (`?sslmode=require`)
- `AUTH_SECRET` — segredo forte para sessões
- `NEXTAUTH_URL` — URL pública do app (ex.: `https://seu-app.vercel.app`)

## Módulos

`auth`, `users`, `clients`, `managers`, `incomes`, `fixed-costs`, `expenses`, `debts`, `renegotiations`, `action-plans`, `gamification`, `notifications`, `reports`, `audit-log`
