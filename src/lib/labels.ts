export const LEVELS = [
  { level: 1, name: "Começando", minPoints: 0 },
  { level: 2, name: "Organizando", minPoints: 50 },
  { level: 3, name: "Evoluindo", minPoints: 150 },
  { level: 4, name: "No controle", minPoints: 300 },
  { level: 5, name: "Planejador", minPoints: 500 },
  { level: 6, name: "Consistente", minPoints: 800 },
] as const;

export const POINT_REWARDS = {
  CREATE_INCOME: 5,
  UPDATE_PENDING: 5,
  MARK_PAID: 10,
  COMPLETE_ACTION: 20,
  COMPLETE_ON_TIME: 10,
  REGISTER_RENEGOTIATION: 15,
  UPDATE_DEBT: 5,
  WEEKLY_PLAN: 50,
  MONTHLY_PLAN: 100,
} as const;

export function getLevelInfo(totalPoints: number) {
  let current: (typeof LEVELS)[number] = LEVELS[0];
  let next: (typeof LEVELS)[number] | null = LEVELS[1] ?? null;

  for (let i = 0; i < LEVELS.length; i++) {
    if (totalPoints >= LEVELS[i].minPoints) {
      current = LEVELS[i];
      next = LEVELS[i + 1] ?? null;
    }
  }

  const progressBase = current.minPoints;
  const progressTarget = next?.minPoints ?? current.minPoints + 100;
  const progress =
    next == null
      ? 100
      : Math.min(
          100,
          Math.round(
            ((totalPoints - progressBase) / (progressTarget - progressBase)) * 100,
          ),
        );

  return {
    ...current,
    nextLevelName: next?.name ?? null,
    pointsToNext: next ? Math.max(0, next.minPoints - totalPoints) : 0,
    progress,
  };
}

export const FINANCIAL_STATUS_LABELS: Record<string, string> = {
  PAGO: "Pago",
  PENDENTE: "Pendente",
  RECEBIDO: "Recebido",
  EM_ABERTO: "Em aberto",
  EM_NEGOCIACAO: "Em negociação",
  RENEGOCIADO: "Renegociado",
  CANCELADO: "Cancelado",
};

export const APPROVAL_STATUS_LABELS: Record<string, string> = {
  APROVADO: "Aprovado",
  REPROVADO: "Reprovado",
  AGUARDANDO_APROVACAO: "Aguardando aprovação",
};

export const RECURRENCE_LABELS: Record<string, string> = {
  UNICA: "Única",
  SEMANAL: "Semanal",
  MENSAL: "Mensal",
  ANUAL: "Anual",
  PAGAMENTO_UNICO: "Pagamento único",
};

export const INCOME_TYPE_LABELS: Record<string, string> = {
  SALARIO: "Salário",
  BENEFICIO: "Benefício",
  TRABALHO_EXTRA: "Trabalho extra",
  PENSAO: "Pensão",
  VENDA: "Venda",
  OUTRO: "Outro",
};

export const PRIORITY_LABELS: Record<string, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

export const PLAN_STATUS_LABELS: Record<string, string> = {
  NAO_INICIADO: "Não iniciado",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  ATRASADO: "Atrasado",
  PAUSADO: "Pausado",
};

export const ACTION_STATUS_LABELS: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  NAO_REALIZADA: "Não realizada",
};

export const ACTION_CATEGORY_LABELS: Record<string, string> = {
  PAGAMENTO: "Pagamento",
  ORGANIZACAO: "Organização",
  RENEGOCIACAO: "Renegociação",
  RESERVA_FINANCEIRA: "Reserva financeira",
  ATUALIZACAO_CADASTRAL: "Atualização cadastral",
  CONTATO_COM_CREDOR: "Contato com credor",
  OUTRO: "Outro",
};

export const RENEGOTIATION_STATUS_LABELS: Record<string, string> = {
  AGUARDANDO_APROVACAO: "Aguardando aprovação",
  APROVADA: "Aprovada",
  REPROVADA: "Reprovada",
  ATIVA: "Ativa",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

export const CHANNEL_LABELS: Record<string, string> = {
  TELEFONE: "Telefone",
  APLICATIVO: "Aplicativo",
  SITE: "Site",
  PRESENCIAL: "Presencial",
  OUTRO: "Outro",
};

export const FIXED_COST_CATEGORIES = [
  "Aluguel",
  "Energia",
  "Água",
  "Internet",
  "Telefone",
  "Escola",
  "Transporte",
  "Plano de saúde",
  "Seguro",
  "Assinatura",
  "Imposto",
  "Outro",
] as const;
