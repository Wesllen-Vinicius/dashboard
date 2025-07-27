'use client';

import { useMemo, useState } from 'react';
import { formatCurrency, formatNumber } from '@/lib/utils/formatters';
import { useDataStore } from '@/store/data.store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Produto, Unidade, Movimentacao } from '@/lib/schemas';

// Calcula a quantidade real de cada produto com base nas movimentações
function getQuantidadeReal(produtoId: string, movimentacoes: Movimentacao[]) {
  return movimentacoes
    .filter((m) => m.produtoId === produtoId)
    .reduce((acc, m) => acc + (m.tipo === "entrada" ? m.quantidade : -m.quantidade), 0);
}

function getProdutosPorTipo(produtos: Produto[], tipo: Produto['tipoProduto']) {
  return produtos.filter(p => p.tipoProduto === tipo && p.status === "ativo");
}

function calculaTotais(
  produtos: Produto[],
  unidades: Unidade[],
  movimentacoes: Movimentacao[],
  tipo: Produto['tipoProduto']
) {
  let valorTotal = 0;
  let qtdTotal = 0;
  let pesoTotal = 0;

  produtos.forEach((p) => {
    const qtd = getQuantidadeReal(p.id!, movimentacoes);
    let valor = 0;

    if (tipo === "VENDA") {
      const preco = (p as any).precoVenda ?? 0;
      valor = qtd * preco;
    } else if ("custoUnitario" in p) {
      valor = qtd * ((p as any).custoUnitario ?? 0);
    }

    valorTotal += valor;
    qtdTotal += qtd;

    // Peso em KG (para VENDA)
    const unidade = unidades.find((u) => u.id === (p as any).unidadeId);
    const sigla = unidade?.sigla.toUpperCase() ?? "UN";
    if (sigla === "KG") pesoTotal += qtd;
    if (sigla === "UN" && p.nome.toLowerCase().includes("mocoto")) pesoTotal += qtd * 1.7;
  });

  return { valorTotal, qtdTotal, pesoTotal };
}

export function EstoqueStatsCards() {
  const { produtos, unidades, movimentacoes } = useDataStore();
  const [tab, setTab] = useState<string>("VENDA");

  const tipos = [
    { tipo: "VENDA", label: "Para Venda" },
    { tipo: "USO_INTERNO", label: "Uso Interno" },
    { tipo: "MATERIA_PRIMA", label: "Matéria-Prima" }
  ] as const;

  const produtosPorTipo = useMemo(() => ({
    VENDA: getProdutosPorTipo(produtos, "VENDA"),
    USO_INTERNO: getProdutosPorTipo(produtos, "USO_INTERNO"),
    MATERIA_PRIMA: getProdutosPorTipo(produtos, "MATERIA_PRIMA"),
  }), [produtos]);

  const totaisPorTipo = useMemo(() => ({
    VENDA: calculaTotais(produtosPorTipo.VENDA, unidades, movimentacoes, "VENDA"),
    USO_INTERNO: calculaTotais(produtosPorTipo.USO_INTERNO, unidades, movimentacoes, "USO_INTERNO"),
    MATERIA_PRIMA: calculaTotais(produtosPorTipo.MATERIA_PRIMA, unidades, movimentacoes, "MATERIA_PRIMA"),
  }), [produtosPorTipo, unidades, movimentacoes]);

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="mb-6 flex">
        {tipos.map(t => (
          <TabsTrigger key={t.tipo} value={t.tipo} className="flex-1">{t.label}</TabsTrigger>
        ))}
      </TabsList>
      {tipos.map(({ tipo, label }) => (
        <TabsContent key={tipo} value={tipo} className="space-y-8">
          <h2 className="text-xl font-bold">{`Produtos ${label}`}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {produtosPorTipo[tipo].length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">Nenhum produto cadastrado.</CardContent>
              </Card>
            )}
            {produtosPorTipo[tipo].map((p) => {
              const unidade = unidades.find(u => u.id === (p as any).unidadeId);
              const sigla = unidade?.sigla.toUpperCase() ?? "UN";
              const qtd = getQuantidadeReal(p.id!, movimentacoes);

              // Valor para VENDA = precoVenda, outros = custoUnitario
              const valor = tipo === "VENDA"
                ? qtd * ((p as any).precoVenda ?? 0)
                : qtd * ((p as any).custoUnitario ?? 0);

              return (
                <Card key={p.id}>
                  <CardHeader>
                    <CardTitle>{p.nome}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{formatNumber(qtd)} {sigla}</div>
                    <div className="text-sm text-muted-foreground">
                      Valor: {formatCurrency(valor)}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
            <Card>
              <CardHeader><CardTitle>Valor Total</CardTitle></CardHeader>
              <CardContent><span className="text-2xl font-bold">{formatCurrency(totaisPorTipo[tipo].valorTotal)}</span></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Quantidade Total</CardTitle></CardHeader>
              <CardContent><span className="text-2xl font-bold">{formatNumber(totaisPorTipo[tipo].qtdTotal)}</span></CardContent>
            </Card>
            {tipo === "VENDA" && (
              <Card>
                <CardHeader><CardTitle>Peso Total (KG)</CardTitle></CardHeader>
                <CardContent><span className="text-2xl font-bold">{formatNumber(totaisPorTipo[tipo].pesoTotal)} kg</span></CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
