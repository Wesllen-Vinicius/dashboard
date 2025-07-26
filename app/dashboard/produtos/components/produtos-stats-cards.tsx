"use client";

import { useMemo } from 'react';
import { Produto } from '@/lib/schemas';

import { formatCurrency, formatNumber } from '@/lib/utils/formatters';
import { StatsCard } from './stats-card';

interface ProdutosStatsCardsProps {
  produtos: Produto[];
}

export function ProdutosStatsCards({ produtos }: ProdutosStatsCardsProps) {
  const stats = useMemo(() => {
    const produtosDeVenda = produtos.filter(p => p.tipoProduto === 'VENDA' && p.status === 'ativo');

    const valorTotalEstoque = produtosDeVenda.reduce((acc, p) => {
        const precoCusto = p.custoUnitario || 0;
        const quantidade = p.quantidade || 0;
        return acc + (precoCusto * quantidade);
    }, 0);

    const quantidadeItensEstoque = produtosDeVenda.reduce((acc, p) => acc + (p.quantidade || 0), 0);

    const produtosEstoqueBaixo = produtosDeVenda.filter(p => (p.quantidade || 0) <= 10).length;

    const totalSKU = produtosDeVenda.length;

    return {
      valorTotalEstoque: formatCurrency(valorTotalEstoque),
      quantidadeItensEstoque: formatNumber(quantidadeItensEstoque),
      produtosEstoqueBaixo,
      totalSKU,
    };
  }, [produtos]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard title="Valor do Estoque (Custo)" value={stats.valorTotalEstoque} description="Soma do custo de todos os produtos em estoque." isCurrency />
      <StatsCard title="Itens em Estoque" value={`${stats.quantidadeItensEstoque} un.`} description="Soma das quantidades de todos os produtos." />
      <StatsCard title="Produtos com Estoque Baixo" value={stats.produtosEstoqueBaixo.toString()} description="Produtos com 10 ou menos unidades." />
      <StatsCard title="Total de SKUs Ativos" value={stats.totalSKU.toString()} description="Número de produtos únicos para venda." />
    </div>
  );
}
