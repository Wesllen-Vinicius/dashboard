'use client';

import { useMemo } from 'react';
import { formatCurrency, formatNumber } from '@/lib/utils/formatters';
import { useDataStore } from '@/store/data.store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { ProdutoVenda } from '@/lib/schemas';

export function EstoqueStatsCards() {
  const { produtos, unidades } = useDataStore();

  // 1) filtra apenas produtos de venda ativos
  const produtosVendaAtivos = useMemo(
    (): ProdutoVenda[] =>
      produtos.filter(
        (p): p is ProdutoVenda => p.tipoProduto === 'VENDA' && p.status === 'ativo'
      ),
    [produtos]
  );

  const {
    estoquePorSKU,
    valorTotal,
    pesoTotalKG,
    pesoMedioMocoto
  } = useMemo(() => {
    type Item = {
      id: string;
      nome: string;
      quantidade: number;
      unidadeSigla: string;
      valor: number;
    };

    const arr: Item[] = [];
    let valorTotal = 0;
    let pesoTotalKG = 0;
    let mocotoQuantidade = 0;
    let mocotoPesoTotal = 0;

    produtosVendaAtivos.forEach((p) => {
      const qtd = p.quantidade || 0;
      const custo = p.custoUnitario || 0;
      const valor = qtd * custo;
      valorTotal += valor;

      const uni = unidades.find((u) => u.id === p.unidadeId);
      const sigla = uni?.sigla.toUpperCase() || 'UN';

      if (sigla === 'KG') {
        pesoTotalKG += qtd;
      }

      // identifica mocotó pelo nome (ou por algum ID fixo, se preferir)
      if (p.nome.toLowerCase().includes('mocoto')) {
        mocotoQuantidade += qtd;
        mocotoPesoTotal += qtd; // aqui assumimos qtd em kg
      }

      arr.push({
        id: p.id!,
        nome: p.nome,
        quantidade: qtd,
        unidadeSigla: sigla,
        valor,
      });
    });

    // evita divisão por zero
    const pesoMedioMocoto = mocotoQuantidade > 0
      ? mocotoPesoTotal / mocotoQuantidade
      : 1.7; // valor padrão se zero

    return {
      estoquePorSKU: arr,
      valorTotal,
      pesoTotalKG,
      pesoMedioMocoto,
    };
  }, [produtosVendaAtivos, unidades]);

  return (
    <div className="space-y-8">
      {/* 1) Cards por SKU */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {estoquePorSKU.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle>{item.nome}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">
                {formatNumber(item.quantidade)} {item.unidadeSigla}
              </p>
              <p className="text-sm text-muted-foreground">
                Valor: {formatCurrency(item.valor)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 2) Cards de totais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Valor Total em Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(valorTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Peso Total (KG)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(pesoTotalKG)} kg</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
