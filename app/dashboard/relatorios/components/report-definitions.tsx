"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
    getMovimentacoesPorPeriodo, getVendasPorPeriodo, getProducoesPorPeriodo, getClientesPorPeriodo,
    getFornecedoresPorPeriodo, getProdutosPorPeriodo, getFuncionariosPorPeriodo, getComprasPorPeriodo,
    getContasAPagarPorPeriodo, getContasAReceberPorPeriodo, getDespesasPorPeriodo
} from "@/lib/services/relatorios.services";
import { ReportKey } from "../types";
import { DespesaOperacional } from "@/lib/schemas";

// Mapeia cada tipo de relatório para sua função de busca de dados
export const getReportFetchers = () => ({
    vendas: getVendasPorPeriodo,
    producao: getProducoesPorPeriodo,
    movimentacoes: getMovimentacoesPorPeriodo,
    compras: getComprasPorPeriodo,
    clientes: getClientesPorPeriodo,
    fornecedores: getFornecedoresPorPeriodo,
    produtos: getProdutosPorPeriodo,
    funcionarios: getFuncionariosPorPeriodo,
    contasAPagar: getContasAPagarPorPeriodo,
    contasAReceber: getContasAReceberPorPeriodo,
    despesas: getDespesasPorPeriodo,
});

// Define as colunas da tabela para cada tipo de relatório
export const getReportColumns = (reportType: ReportKey): ColumnDef<any>[] => {
    const formatCurrency = (value: number) => `R$ ${Number(value || 0).toFixed(2)}`;
    const formatDate = (value: any) => value ? format(new Date(value), "dd/MM/yyyy") : 'N/A';

    switch (reportType) {
        case 'vendas': return [
            { id: 'data', header: 'Data', accessorKey: 'data', cell: ({ row }) => formatDate(row.original.data) },
            { id: 'clienteNome', header: "Cliente", accessorKey: "clienteNome" },
            { id: 'valorTotal', header: "Valor", accessorKey: 'valorTotal', cell: ({ row }) => formatCurrency(row.original.valorTotal) },
            { id: 'status', header: 'Status', accessorKey: 'status', cell: ({ row }) => <Badge variant={row.original.status === 'Paga' ? 'success' : 'warning'}>{row.original.status}</Badge> }
        ];
        case 'compras': return [
            { id: 'data', header: 'Data', accessorKey: 'data', cell: ({ row }) => formatDate(row.original.data) },
            { id: 'fornecedorNome', header: 'Fornecedor', accessorKey: 'fornecedorNome' },
            { id: 'notaFiscal', header: 'NF', accessorKey: 'notaFiscal' },
            { id: 'valorTotal', header: "Valor", accessorKey: 'valorTotal', cell: ({ row }) => formatCurrency(row.original.valorTotal) }
        ];
        case 'producao': return [
            { id: 'data', header: 'Data', accessorKey: 'data', cell: ({ row }) => formatDate(row.original.data) },
            { id: 'lote', header: 'Lote', accessorKey: 'lote' },
            { id: 'responsavelNome', header: 'Responsável', accessorKey: 'responsavelNome' }
        ];
        case 'clientes': return [
            { id: 'createdAt', header: 'Data Cadastro', accessorKey: 'createdAt', cell: ({ row }) => formatDate(row.original.createdAt) },
            { id: 'nomeRazaoSocial', header: 'Nome', accessorKey: 'nomeRazaoSocial' },
            { id: 'cpfCnpj', header: 'Documento', accessorKey: 'cpfCnpj' },
            { id: 'telefone', header: 'Telefone', accessorKey: 'telefone' }
        ];
        case 'fornecedores': return [
            { id: 'createdAt', header: 'Data Cadastro', accessorKey: 'createdAt', cell: ({ row }) => formatDate(row.original.createdAt) },
            { id: 'nomeRazaoSocial', header: 'Razão Social', accessorKey: 'nomeRazaoSocial' },
            { id: 'cpfCnpj', header: 'CNPJ', accessorKey: 'cpfCnpj' },
            { id: 'telefone', header: 'Contato', accessorKey: 'telefone' }
        ];
        case 'produtos': return [
            { id: 'createdAt', header: 'Data Cadastro', accessorKey: 'createdAt', cell: ({ row }) => formatDate(row.original.createdAt) },
            { id: 'nome', header: 'Nome', accessorKey: 'nome' },
            { id: 'tipoProduto', header: 'Tipo', accessorKey: 'tipoProduto' },
            { id: 'quantidade', header: 'Estoque', accessorKey: 'quantidade' }
        ];
        case 'funcionarios': return [
            { id: 'createdAt', header: 'Data Cadastro', accessorKey: 'createdAt', cell: ({ row }) => formatDate(row.original.createdAt) },
            { id: 'nomeCompleto', header: 'Nome', accessorKey: 'nomeCompleto' },
            { id: 'cargoNome', header: 'Cargo', accessorKey: 'cargoNome' },
            { id: 'contato', header: 'Contato', accessorKey: 'contato' }
        ];
        case 'contasAPagar': return [
            { id: 'dataEmissao', header: 'Emissão', accessorKey: 'dataEmissao', cell: ({ row }) => formatDate(row.original.dataEmissao) },
            { id: 'dataVencimento', header: 'Vencimento', accessorKey: 'dataVencimento', cell: ({ row }) => formatDate(row.original.dataVencimento) },
            { id: 'fornecedorNome', header: 'Fornecedor', accessorKey: 'fornecedorNome' },
            { id: 'valor', header: "Valor", accessorKey: 'valor', cell: ({ row }) => formatCurrency(row.original.valor) },
            { id: 'status', header: 'Status', accessorKey: 'status', cell: ({ row }) => <Badge variant={row.original.status === 'Paga' ? 'success' : 'warning'}>{row.original.status}</Badge> }
        ];
        case 'contasAReceber': return [
            { id: 'dataEmissao', header: 'Emissão', accessorKey: 'dataEmissao', cell: ({ row }) => formatDate(row.original.dataEmissao) },
            { id: 'dataVencimento', header: 'Vencimento', accessorKey: 'dataVencimento', cell: ({ row }) => formatDate(row.original.dataVencimento) },
            { id: 'clienteNome', header: 'Cliente', accessorKey: 'clienteNome' },
            { id: 'valor', header: "Valor", accessorKey: 'valor', cell: ({ row }) => formatCurrency(row.original.valor) },
            { id: 'status', header: 'Status', accessorKey: 'status', cell: ({ row }) => <Badge variant={row.original.status === 'Recebida' ? 'success' : 'warning'}>{row.original.status}</Badge> }
        ];
        case 'despesas': return [
            { id: 'dataVencimento', header: 'Vencimento', accessorKey: 'dataVencimento', cell: ({ row }) => formatDate(row.original.dataVencimento) },
            { id: 'descricao', header: 'Descrição', accessorKey: 'descricao' },
            { id: 'categoria', header: 'Categoria', accessorKey: 'categoria' },
            { id: 'valor', header: "Valor", accessorKey: 'valor', cell: ({ row }) => formatCurrency(row.original.valor) },
            { id: 'status', header: 'Status', accessorKey: 'status', cell: ({ row }) => <Badge variant={(row.original as DespesaOperacional).status === 'Paga' ? 'success' : 'warning'}>{(row.original as DespesaOperacional).status}</Badge> }
        ];
        default: return [
            { id: 'data', header: 'Data', accessorKey: 'data', cell: ({ row }) => format(new Date(row.original.data), "dd/MM/yyyy HH:mm") },
            { id: 'produtoNome', header: "Produto", accessorKey: "produtoNome" },
            { id: 'tipo', header: "Tipo", accessorKey: 'tipo', cell: ({ row }) => <Badge variant={row.original.tipo === 'entrada' ? 'success' : 'destructive'} className="capitalize">{row.original.tipo}</Badge> },
            { id: 'quantidade', header: "Quantidade", accessorKey: "quantidade" },
        ];
    }
};
