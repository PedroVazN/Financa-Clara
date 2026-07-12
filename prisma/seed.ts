import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, subDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  await prisma.renegotiationPayment.deleteMany();
  await prisma.debtRenegotiation.deleteMany();
  await prisma.actionValidation.deleteMany();
  await prisma.actionItem.deleteMany();
  await prisma.actionPlan.deleteMany();
  await prisma.pointTransaction.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.gamificationProfile.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.income.deleteMany();
  await prisma.fixedCost.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.debt.deleteMany();
  await prisma.managerClientRelationship.deleteMany();
  await prisma.clientProfile.deleteMany();
  await prisma.managerProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("123456", 10);

  const clientUser = await prisma.user.create({
    data: {
      name: "Ana Souza",
      email: "cliente@demo.com",
      passwordHash,
      role: UserRole.CLIENT,
      clientProfile: { create: { phone: "(11) 98888-1000", city: "São Paulo" } },
    },
    include: { clientProfile: true },
  });

  const managerUser = await prisma.user.create({
    data: {
      name: "Carlos Mendes",
      email: "gestor@demo.com",
      passwordHash,
      role: UserRole.MANAGER,
      managerProfile: { create: { company: "Orientação Financeira Clara" } },
    },
    include: { managerProfile: true },
  });

  const clientId = clientUser.clientProfile!.id;
  const managerId = managerUser.managerProfile!.id;

  await prisma.managerClientRelationship.create({
    data: { managerId, clientId },
  });

  const now = new Date();

  await prisma.income.createMany({
    data: [
      {
        clientId,
        description: "Salário mensal",
        category: "Trabalho",
        amount: 3200,
        receivedAt: subDays(now, 5),
        incomeType: "SALARIO",
        recurrence: "MENSAL",
        recurrenceStart: subDays(now, 35),
        financialStatus: "RECEBIDO",
        approvalStatus: "APROVADO",
      },
      {
        clientId,
        description: "Freelance design",
        category: "Extra",
        amount: 450,
        receivedAt: subDays(now, 12),
        incomeType: "TRABALHO_EXTRA",
        recurrence: "UNICA",
        financialStatus: "RECEBIDO",
        approvalStatus: "APROVADO",
      },
      {
        clientId,
        description: "Benefício alimentação",
        category: "Benefício",
        amount: 600,
        receivedAt: addDays(now, 3),
        incomeType: "BENEFICIO",
        recurrence: "MENSAL",
        recurrenceStart: subDays(now, 60),
        financialStatus: "PENDENTE",
        approvalStatus: "AGUARDANDO_APROVACAO",
      },
    ],
  });

  await prisma.fixedCost.createMany({
    data: [
      {
        clientId,
        name: "Aluguel",
        category: "Aluguel",
        amount: 1200,
        frequency: "MENSAL",
        dueDay: 10,
        nextDueDate: addDays(now, 8),
        paymentMethod: "Pix",
        financialStatus: "PENDENTE",
        approvalStatus: "APROVADO",
      },
      {
        clientId,
        name: "Energia elétrica",
        category: "Energia",
        amount: 180,
        frequency: "MENSAL",
        dueDay: 15,
        nextDueDate: addDays(now, 13),
        paymentMethod: "Boleto",
        financialStatus: "PENDENTE",
        approvalStatus: "AGUARDANDO_APROVACAO",
      },
      {
        clientId,
        name: "Internet",
        category: "Internet",
        amount: 99.9,
        frequency: "MENSAL",
        dueDay: 5,
        nextDueDate: addDays(now, 3),
        paymentMethod: "Débito automático",
        financialStatus: "PAGO",
        approvalStatus: "APROVADO",
      },
      {
        clientId,
        name: "Plano de saúde",
        category: "Plano de saúde",
        amount: 320,
        frequency: "MENSAL",
        dueDay: 20,
        nextDueDate: addDays(now, 18),
        paymentMethod: "Cartão",
        financialStatus: "PENDENTE",
        approvalStatus: "APROVADO",
      },
    ],
  });

  await prisma.expense.createMany({
    data: [
      {
        clientId,
        description: "Mercado da semana",
        category: "Alimentação",
        amount: 280,
        date: subDays(now, 2),
        paymentMethod: "Cartão débito",
        recurrence: "SEMANAL",
        financialStatus: "PAGO",
        approvalStatus: "APROVADO",
      },
      {
        clientId,
        description: "Farmácia",
        category: "Saúde",
        amount: 65,
        date: subDays(now, 7),
        paymentMethod: "Pix",
        recurrence: "UNICA",
        financialStatus: "PAGO",
        approvalStatus: "APROVADO",
      },
      {
        clientId,
        description: "Transporte app",
        category: "Transporte",
        amount: 42,
        date: addDays(now, 1),
        paymentMethod: "Cartão",
        recurrence: "UNICA",
        financialStatus: "PENDENTE",
        approvalStatus: "AGUARDANDO_APROVACAO",
      },
    ],
  });

  const debtOpen1 = await prisma.debt.create({
    data: {
      clientId,
      name: "Cartão de crédito",
      creditor: "Banco Aurora",
      category: "Cartão",
      originalAmount: 4500,
      openBalance: 2800,
      contractedAt: subDays(now, 400),
      dueDate: addDays(now, 20),
      installmentCount: 8,
      installmentValue: 350,
      frequency: "MENSAL",
      financialStatus: "EM_ABERTO",
      approvalStatus: "APROVADO",
      priority: "ALTA",
      notes: "Priorizar quitação parcial.",
    },
  });

  await prisma.debt.create({
    data: {
      clientId,
      name: "Empréstimo pessoal",
      creditor: "CrediFácil",
      category: "Empréstimo",
      originalAmount: 6000,
      openBalance: 3200,
      contractedAt: subDays(now, 200),
      dueDate: addDays(now, 35),
      installmentCount: 12,
      installmentValue: 280,
      frequency: "MENSAL",
      financialStatus: "EM_ABERTO",
      approvalStatus: "APROVADO",
      priority: "MEDIA",
    },
  });

  const debtReneg = await prisma.debt.create({
    data: {
      clientId,
      name: "Financiamento celular",
      creditor: "Loja TechMais",
      category: "Financiamento",
      originalAmount: 2400,
      openBalance: 900,
      contractedAt: subDays(now, 300),
      dueDate: addDays(now, 10),
      installmentCount: 6,
      installmentValue: 150,
      frequency: "MENSAL",
      financialStatus: "RENEGOCIADO",
      approvalStatus: "APROVADO",
      priority: "MEDIA",
    },
  });

  const renegotiation = await prisma.debtRenegotiation.create({
    data: {
      debtId: debtReneg.id,
      renegotiatedAt: subDays(now, 15),
      agreementDesc: "Acordo de 6 parcelas fixas sem entrada.",
      totalAmount: 900,
      downPayment: 0,
      paymentAmount: 150,
      paymentCount: 6,
      frequency: "MENSAL",
      firstPaymentDate: addDays(now, 10),
      attendantName: "Juliana",
      channel: "TELEFONE",
      protocolNumber: "RN-2026-441",
      status: "ATIVA",
      notes: "Cliente registrou o acordo manualmente.",
    },
  });

  await prisma.renegotiationPayment.createMany({
    data: Array.from({ length: 6 }).map((_, i) => ({
      renegotiationId: renegotiation.id,
      dueDate: addDays(now, 10 + i * 30),
      amount: 150,
      financialStatus: i === 0 ? "PENDENTE" : "PENDENTE",
    })),
  });

  const plan = await prisma.actionPlan.create({
    data: {
      clientId,
      managerId,
      title: "Organização financeira de julho",
      objective: "Reduzir pendências e manter dados atualizados",
      description:
        "Plano focado em pagamentos essenciais, contato com credor e reservas pequenas.",
      startDate: subDays(now, 7),
      dueDate: addDays(now, 23),
      priority: "ALTA",
      status: "EM_ANDAMENTO",
      notes: "Acompanhar semanalmente.",
      items: {
        create: [
          {
            title: "Pagar conta de energia até o vencimento",
            description: "Separar o valor assim que o benefício chegar.",
            category: "PAGAMENTO",
            relatedItemLabel: "Energia elétrica",
            relatedAmount: 180,
            dueDate: addDays(now, 13),
            priority: "ALTA",
            pointsAwarded: 20,
            status: "PENDENTE",
            guidance: "Priorize este pagamento antes de gastos variáveis.",
          },
          {
            title: "Entrar em contato com o credor da dívida do cartão",
            description: "Pedir opções de acordo e anotar o protocolo.",
            category: "CONTATO_COM_CREDOR",
            relatedItemLabel: debtOpen1.name,
            dueDate: addDays(now, 5),
            priority: "URGENTE",
            pointsAwarded: 20,
            status: "EM_ANDAMENTO",
            guidance: "Anote nome do atendente e número do protocolo.",
          },
          {
            title: "Reservar R$ 200,00 da próxima entrada",
            description: "Guardar para o aluguel.",
            category: "RESERVA_FINANCEIRA",
            relatedAmount: 200,
            dueDate: addDays(now, 4),
            priority: "ALTA",
            pointsAwarded: 20,
            status: "PENDENTE",
            guidance: "Faça a reserva no mesmo dia do recebimento.",
          },
          {
            title: "Atualizar a situação do aluguel",
            description: "Marcar como pago assim que realizar o pagamento.",
            category: "ATUALIZACAO_CADASTRAL",
            relatedItemLabel: "Aluguel",
            dueDate: addDays(now, 8),
            priority: "MEDIA",
            pointsAwarded: 20,
            status: "PENDENTE",
            guidance: "Mantenha o comprovante anexado nas observações.",
          },
          {
            title: "Evitar novas compras parceladas neste mês",
            description: "Foque nas contas já cadastradas.",
            category: "ORGANIZACAO",
            dueDate: addDays(now, 20),
            priority: "MEDIA",
            pointsAwarded: 20,
            status: "PENDENTE",
            guidance: "Se precisar, converse antes com seu gestor.",
          },
        ],
      },
    },
  });

  const achievements = await prisma.achievement.createMany({
    data: [
      {
        code: "FIRST_REGISTER",
        title: "Primeiro cadastro",
        description: "Você deu o primeiro passo organizando suas finanças.",
      },
      {
        code: "FIRST_PAID",
        title: "Primeira conta paga",
        description: "Mais uma pendência resolvida.",
      },
      {
        code: "FIRST_RENEG",
        title: "Primeira dívida renegociada",
        description: "Você registrou um acordo com clareza.",
      },
      {
        code: "WEEK_ORGANIZED",
        title: "Uma semana organizada",
        description: "Seus dados ficaram atualizados por uma semana.",
      },
      {
        code: "THREE_ACTIONS",
        title: "Três ações concluídas",
        description: "Você está avançando no plano.",
      },
      {
        code: "WEEKLY_PLAN",
        title: "Plano semanal completo",
        description: "Boa! Você concluiu as ações da semana.",
      },
      {
        code: "MONTH_CONSISTENCY",
        title: "Um mês de consistência",
        description: "Seu progresso está crescendo de forma constante.",
      },
      {
        code: "ALL_UPDATED",
        title: "Todas as contas atualizadas",
        description: "Seus dados estão atualizados. Continue assim.",
      },
      {
        code: "ON_TIME_PAYMENT",
        title: "Pagamento no prazo",
        description: "Você marcou um pagamento dentro do prazo.",
      },
    ],
  });

  void achievements;

  const allAchievements = await prisma.achievement.findMany();
  const firstRegister = allAchievements.find((a) => a.code === "FIRST_REGISTER")!;
  const firstPaid = allAchievements.find((a) => a.code === "FIRST_PAID")!;
  const firstReneg = allAchievements.find((a) => a.code === "FIRST_RENEG")!;

  await prisma.userAchievement.createMany({
    data: [
      { clientId, achievementId: firstRegister.id },
      { clientId, achievementId: firstPaid.id },
      { clientId, achievementId: firstReneg.id },
    ],
  });

  await prisma.gamificationProfile.create({
    data: {
      clientId,
      totalPoints: 95,
      level: 2,
      streakDays: 4,
      lastActivityAt: now,
    },
  });

  await prisma.pointTransaction.createMany({
    data: [
      {
        clientId,
        points: 5,
        reason: "Cadastro de entrada",
        sourceKey: "seed-income-1",
      },
      {
        clientId,
        points: 10,
        reason: "Marcou conta como paga",
        sourceKey: "seed-paid-1",
      },
      {
        clientId,
        points: 15,
        reason: "Registrou renegociação",
        sourceKey: "seed-reneg-1",
      },
      {
        clientId,
        points: 20,
        reason: "Concluiu ação do plano",
        sourceKey: "seed-action-1",
      },
      {
        clientId,
        points: 45,
        reason: "Atualizações recentes",
        sourceKey: "seed-misc-1",
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: clientUser.id,
        title: "Nova ação no seu plano",
        message: "Seu gestor adicionou orientações para esta semana.",
        type: "ACTION_PLAN",
        href: "/cliente/plano",
      },
      {
        userId: clientUser.id,
        title: "Próximo vencimento",
        message: "A internet vence em breve. Você já pode se organizar.",
        type: "DUE_DATE",
        href: "/cliente/custos-fixos",
      },
      {
        userId: clientUser.id,
        title: "Pontos conquistados",
        message: "Boa! Seu progresso está crescendo.",
        type: "POINTS",
        href: "/cliente/progresso",
        readAt: subDays(now, 1),
      },
      {
        userId: managerUser.id,
        title: "Cliente atualizou dados",
        message: "Ana Souza registrou uma renegociação.",
        type: "CLIENT_UPDATE",
        href: `/gestor/clientes/${clientId}`,
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        userId: clientUser.id,
        entityType: "Income",
        entityId: "seed",
        action: "CREATE",
        newData: JSON.stringify({ description: "Salário mensal", amount: 3200 }),
      },
      {
        userId: clientUser.id,
        entityType: "Debt",
        entityId: debtReneg.id,
        action: "STATUS_CHANGE",
        previousData: JSON.stringify({ financialStatus: "EM_ABERTO" }),
        newData: JSON.stringify({ financialStatus: "RENEGOCIADO" }),
      },
      {
        userId: managerUser.id,
        entityType: "ActionPlan",
        entityId: plan.id,
        action: "CREATE",
        newData: JSON.stringify({ title: plan.title }),
      },
    ],
  });

  console.log("Seed concluído!");
  console.log("Cliente: cliente@demo.com / 123456");
  console.log("Gestor:  gestor@demo.com / 123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
