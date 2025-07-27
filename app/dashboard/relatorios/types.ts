const reportGroups = {
  operacional: {
    label: "Operacional",
    reports: { vendas: "Vendas", compras: "Compras", producao: "Produção", movimentacoes: "Estoque" },
  },
  cadastros: {
    label: "Cadastros",
    reports: { clientes: "Clientes", fornecedores: "Fornecedores", produtos: "Produtos", funcionarios: "Funcionários" },
  },
  financeiro: {
    label: "Financeiro",
    reports: { contasAPagar: "Contas a Pagar", contasAReceber: "Contas a Receber", despesas: "Despesas Operacionais" },
  },
};

export const allReportLabels = {
    ...reportGroups.operacional.reports,
    ...reportGroups.cadastros.reports,
    ...reportGroups.financeiro.reports,
};

export type ReportKey = keyof typeof allReportLabels;
