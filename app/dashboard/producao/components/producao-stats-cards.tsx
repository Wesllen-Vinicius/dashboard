"use client";

import { useMemo } from 'react';
import { Producao, Abate, Produto } from '@/lib/schemas';
import { formatCurrency, formatNumber } from '@/lib/utils/formatters';
import { useDataStore } from '@/store/data.store';
import { isThisMonth } from 'date-fns';
import { StatsCard } from './stats-card';

interface ProducaoStatsCardsProps {
  producoes: Producao[];
  abates: Abate[];
  produtos: Produto[];
}

export function ProducaoStatsCards({ producoes, abates, produtos }: ProducaoStatsCardsProps) {
  const { unidades } = useDataStore();

  const stats = useMemo(() => {
    const producoesDoMes = producoes.filter(p => isThisMonth(new Date(p.data)));

    // Objeto para armazenar volumes por unidade de medida
    const volumesPorUnidade: { [key: string]: { produzido: number, perdas: number } } = {};

    producoesDoMes.forEach(p => {
      p.produtos.forEach(item => {
        const produto = produtos.find(prod => prod.id === item.produtoId);
        if (produto && 'unidadeId' in produto) {
          const unidade = unidades.find(u => u.id === produto.unidadeId);
          const sigla = unidade?.sigla || 'un';

          if (!volumesPorUnidade[sigla]) {
            volumesPorUnidade[sigla] = { produzido: 0, perdas: 0 };
          }
          volumesPorUnidade[sigla].produzido += item.quantidade;
          volumesPorUnidade[sigla].perdas += (item.perda || 0);
        }
      });
    });

    // Converte o objeto em um array de strings para exibição
    const volumeProduzidoTexto = Object.entries(volumesPorUnidade).map(([sigla, volumes]) => `${formatNumber(volumes.produzido)} ${sigla}`).join(' / ');
    const volumePerdasTexto = Object.entries(volumesPorUnidade).map(([sigla, volumes]) => `${formatNumber(volumes.perdas)} ${sigla}`).join(' / ');

    // Cálculos financeiros (permanecem os mesmos)
    const valorProduzido = producoesDoMes.reduce((acc, p) => acc + p.produtos.reduce((sum, item) => {
        const produto = produtos.find(prod => prod.id === item.produtoId);
        const precoVenda = (produto && 'precoVenda' in produto) ? produto.precoVenda || 0 : 0;
        return sum + (item.quantidade * precoVenda);
    }, 0), 0);

    const valorPerdas = producoesDoMes.reduce((acc, p) => acc + p.produtos.reduce((sum, item) => {
        const produto = produtos.find(prod => prod.id === item.produtoId);
        const custo = produto?.custoUnitario || 0;
        return sum + ((item.perda || 0) * custo);
    }, 0), 0);

    // ... outros cálculos
    const diferencaMetaVsReal = valorProduzido - valorPerdas;
    const registrosNoMes = producoesDoMes.length;

    return {
      volumeProduzido: volumeProduzidoTexto || "0 un.",
      valorProduzido: formatCurrency(valorProduzido),
      volumePerdas: volumePerdasTexto || "0 un.",
      valorPerdas: formatCurrency(valorPerdas),
      registrosNoMes,
      metaAtingida: "N/A", // A lógica de meta atingida precisa ser reavaliada com as novas unidades
      diferencaMetaVsReal: formatCurrency(diferencaMetaVsReal)
    };
  }, [producoes, abates, produtos, unidades]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard title="Volume Produzido (Mês)" value={stats.volumeProduzido} description="Unidades de todos os produtos." />
      <StatsCard title="Meta Atingida (Valor)" value={stats.metaAtingida} description="Valor produzido vs. metas definidas." />
      <StatsCard title="Volume de Perdas (Mês)" value={stats.volumePerdas} description="Unidades de perdas registradas." />
      <StatsCard title="Registros no Mês" value={stats.registrosNoMes.toString()} description="Total de lotes de produção neste mês." />
      <StatsCard title="Valor Produzido (Mês)" value={stats.valorProduzido} description="Valor total dos produtos gerados." isCurrency />
      <StatsCard title="Valor das Perdas (Mês)" value={stats.valorPerdas} description="Custo total das perdas de produção." isCurrency isLoss />
      <StatsCard title="Diferença (Meta vs. Real)" value={stats.diferencaMetaVsReal} description="Valor que a empresa ganhou ou perdeu em relação à meta." isCurrency />
    </div>
  );
}
