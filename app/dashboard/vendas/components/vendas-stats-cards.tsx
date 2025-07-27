"use client";

import { useMemo } from 'react';
import { useDataStore } from '@/store/data.store';
import { isThisMonth, isThisYear } from 'date-fns';
import { formatCurrency } from '@/lib/utils/formatters';
import { StatsCard } from './stats-card';

export function VendasStatsCards() {
  const { vendas } = useDataStore();

  const stats = useMemo(() => {
    const vendasDoMes = vendas.filter(v => isThisMonth(new Date(v.data)));
    const vendasDoAno = vendas.filter(v => isThisYear(new Date(v.data)));

    const faturamentoMes = vendasDoMes.reduce((acc, v) => acc + (v.valorFinal || v.valorTotal), 0);
    const faturamentoAno = vendasDoAno.reduce((acc, v) => acc + (v.valorFinal || v.valorTotal), 0);
    const vendasRealizadasMes = vendasDoMes.length;
    const ticketMedio = vendasRealizadasMes > 0 ? faturamentoMes / vendasRealizadasMes : 0;

    return {
      faturamentoMes: formatCurrency(faturamentoMes),
      faturamentoAno: formatCurrency(faturamentoAno),
      vendasRealizadasMes,
      ticketMedio: formatCurrency(ticketMedio),
    };
  }, [vendas]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard title="Faturamento (Mês)" value={stats.faturamentoMes} description="Soma de todas as vendas no mês atual." isCurrency />
      <StatsCard title="Vendas Realizadas (Mês)" value={stats.vendasRealizadasMes.toString()} description="Número de vendas concluídas no mês." />
      <StatsCard title="Ticket Médio (Mês)" value={stats.ticketMedio} description="Valor médio por venda no mês." isCurrency />
      <StatsCard title="Faturamento (Ano)" value={stats.faturamentoAno} description="Soma de todas as vendas no ano atual." isCurrency />
    </div>
  );
}
