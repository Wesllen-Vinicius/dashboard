'use client';

import { useMemo } from 'react';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Abate, Meta, Producao, Produto } from "@/lib/schemas";
import { TrendingUp, Target, TrendingDown, Package, DollarSign, AlertTriangle, BadgeCheck, MinusCircle } from 'lucide-react';
import { formatNumber, formatCurrency } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';

interface ProducaoStatsCardsProps {
  producoes: Producao[];
  abates: Abate[];
  metas: Meta[];
  produtos: Produto[];
}

export function ProducaoStatsCards({ producoes, abates, metas, produtos }: ProducaoStatsCardsProps) {
  const stats = useMemo(() => {
    const today = new Date();
    const startDate = startOfMonth(today);
    const endDate = endOfMonth(today);

    const producoesDoMes = producoes.filter(p => p.status === 'ativo' && isWithinInterval(new Date(p.data), { start: startDate, end: endDate }));

    let volumeProduzido = 0;
    let volumePerda = 0;
    let valorProduzido = 0;
    let valorPerda = 0;
    let valorEsperado = 0;

    producoesDoMes.forEach(producao => {
      const abateAssociado = abates.find(a => a.id === producao.abateId);
      const animaisAproveitaveis = abateAssociado ? (abateAssociado.total - abateAssociado.condenado) : 0;

      producao.produtos.forEach(item => {
        const produtoInfo = produtos.find(p => p.id === item.produtoId);
        const custoUnitario = produtoInfo?.custoUnitario || 0;

        volumeProduzido += item.quantidade;
        volumePerda += item.perda;
        valorProduzido += item.quantidade * custoUnitario;
        valorPerda += item.perda * custoUnitario;

        const metaAssociada = metas.find(m => m.produtoId === item.produtoId);
        if (metaAssociada && animaisAproveitaveis > 0) {
          valorEsperado += (metaAssociada.metaPorAnimal * animaisAproveitaveis) * custoUnitario;
        }
      });
    });

    const percentualMetaAtingida = valorEsperado > 0 ? (valorProduzido / valorEsperado) * 100 : 0;
    const diferencaFinanceira = valorProduzido - valorEsperado;

    return {
      volumeProduzido: formatNumber(volumeProduzido),
      volumePerda: formatNumber(volumePerda),
      percentualMetaAtingida: percentualMetaAtingida.toFixed(1) + '%',
      totalRegistros: producoesDoMes.length,
      valorProduzido: formatCurrency(valorProduzido),
      valorPerda: formatCurrency(valorPerda),
      valorEsperado: formatCurrency(valorEsperado),
      diferencaFinanceira,
    };
  }, [producoes, abates, metas, produtos]);

  return (
    <div className="space-y-4">
        {/* Cards de Volume */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Volume Produzido (Mês)</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.volumeProduzido} un.</div><p className="text-xs text-muted-foreground">Unidades de todos os produtos.</p></CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Meta Atingida (Valor)</CardTitle><Target className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.percentualMetaAtingida}</div><p className="text-xs text-muted-foreground">Valor produzido vs. metas definidas.</p></CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Volume de Perdas (Mês)</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.volumePerda} un.</div><p className="text-xs text-muted-foreground">Unidades de perdas registradas.</p></CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Registos no Mês</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.totalRegistros}</div><p className="text-xs text-muted-foreground">Total de lotes de produção neste mês.</p></CardContent>
            </Card>
        </div>

        {/* Cards Financeiros */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Valor Produzido (Mês)</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.valorProduzido}</div><p className="text-xs text-muted-foreground">Custo total dos produtos gerados.</p></CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Valor das Perdas (Mês)</CardTitle><AlertTriangle className="h-4 w-4 text-destructive" /></CardHeader>
                <CardContent><div className="text-2xl font-bold text-destructive">{stats.valorPerda}</div><p className="text-xs text-muted-foreground">Custo total das perdas de produção.</p></CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Produção Esperada (Mês)</CardTitle><BadgeCheck className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.valorEsperado}</div><p className="text-xs text-muted-foreground">Valor que deveria ser produzido com base nas metas.</p></CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Diferença (Meta vs. Real)</CardTitle><MinusCircle className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent>
                    <div className={cn("text-2xl font-bold", stats.diferencaFinanceira < 0 ? 'text-destructive' : 'text-green-600')}>
                        {formatCurrency(stats.diferencaFinanceira)}
                    </div>
                    <p className="text-xs text-muted-foreground">Valor que a empresa ganhou ou perdeu em relação à meta.</p>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
