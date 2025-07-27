'use client';

import { useMemo } from 'react';
import { isThisMonth } from 'date-fns';
import { Producao, Abate, Produto, ProdutoVenda, Unidade } from '@/lib/schemas';
import { formatCurrency, formatNumber } from '@/lib/utils/formatters';
import { useDataStore } from '@/store/data.store';
import { StatsCard } from './stats-card';

interface ProducaoStatsCardsProps {
  producoes: Producao[];
  abates: Abate[];
  produtos: Produto[];
}

function isProdutoVenda(p: Produto): p is ProdutoVenda {
  return p.tipoProduto === 'VENDA';
}

export function ProducaoStatsCards({
  producoes,
  abates,
  produtos,
}: ProducaoStatsCardsProps) {
  const { unidades } = useDataStore();

  const stats = useMemo(() => {
    // 1. Filtrar produções deste mês
    const producoesDoMes = producoes.filter(p => isThisMonth(new Date(p.data)));

    // 2. Acumular volumes e perdas por unidade
    const volumesPorUnidade: Record<string, { produzido: number; perdas: number }> = {};

    // 3. Valores financeiros
    let valorRealTotal = 0;  // receita bruta
    let valorMetaTotal = 0;  // meta em valor (para %)
    let valorPerdas = 0;     // receita perdida

    // 4. Quantidade de registros
    const registrosNoMes = producoesDoMes.length;

    producoesDoMes.forEach(p => {
      // Encontrar o abate para calcular animais válidos
      const ab = abates.find(abate => abate.id === p.abateId);
      const animaisValidos = ab ? ab.numeroAnimais - (ab.condenado || 0) : 0;

      p.produtos.forEach(item => {
        const prod = produtos.find(x => x.id === item.produtoId);
        if (!prod) return;

        // Unidades
        const unidade = unidades.find(u =>
          ('unidadeId' in prod && u.id === prod.unidadeId)
        );
        const sigla = unidade?.sigla.toUpperCase() || 'UN';

        volumesPorUnidade[sigla] ??= { produzido: 0, perdas: 0 };
        volumesPorUnidade[sigla].produzido += item.quantidade;
        volumesPorUnidade[sigla].perdas += item.perda || 0;

        if (isProdutoVenda(prod)) {
          const pv = prod.precoVenda || 0;
          // Receita bruta
          valorRealTotal += item.quantidade * pv;
          // Receita-meta
          if (typeof prod.metaPorAnimal === 'number') {
            const metaVol = animaisValidos * prod.metaPorAnimal;
            valorMetaTotal += metaVol * pv;
          }
          // Receita perdida (perda × preço de venda)
          valorPerdas += (item.perda || 0) * pv;
        } else {
          // Para outros tipos, tratar perda como custo
          valorPerdas += (item.perda || 0) * prod.custoUnitario;
        }
      });
    });

    // 5. Formatar volumes
    const volumeProduzido = Object.entries(volumesPorUnidade)
      .map(([s, v]) => `${formatNumber(v.produzido)} ${s}`)
      .join(' / ') || '0 UN';

    const volumePerdas = Object.entries(volumesPorUnidade)
      .map(([s, v]) => `${formatNumber(v.perdas)} ${s}`)
      .join(' / ') || '0 UN';

    // 6. Meta atingida (%)
    const metaAtingida = valorMetaTotal > 0
      ? `${((valorRealTotal / valorMetaTotal) * 100).toFixed(2)}%`
      : '–';

    // 7. Lucro líquido
    const lucroLiquido = valorRealTotal - valorPerdas;

    return {
      volumeProduzido,
      volumePerdas,
      valorProduzido: formatCurrency(valorRealTotal),
      valorPerdas: formatCurrency(valorPerdas),
      registrosNoMes: registrosNoMes.toString(),
      metaAtingida,
      diferencaLiquida: formatCurrency(lucroLiquido),
    };
  }, [producoes, abates, produtos, unidades]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Volume Produzido (Mês)"
        value={stats.volumeProduzido}
        description="Quantidade produzida por unidade"
      />
      <StatsCard
        title="Meta Atingida (%)"
        value={stats.metaAtingida}
        description="Receita realizada vs meta"
      />
      <StatsCard
        title="Volume de Perdas (Mês)"
        value={stats.volumePerdas}
        description="Quantidades perdidas"
      />
      <StatsCard
        title="Registros no Mês"
        value={stats.registrosNoMes}
        description="Número de produções"
      />
      <StatsCard
        title="Receita Bruta"
        value={stats.valorProduzido}
        description="Total estimado em vendas"
        isCurrency
      />
      <StatsCard
        title="Receita Perdida"
        value={stats.valorPerdas}
        description="Valor não realizado"
        isCurrency
        isLoss
      />
      <StatsCard
        title="Lucro Líquido"
        value={stats.diferencaLiquida}
        description="Receita – perdas"
        isCurrency
      />
    </div>
  );
}
