"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Abate, Producao, Produto, ProdutoMateriaPrima, ProdutoVenda, Unidade } from "@/lib/schemas";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { subscribeToAbates } from "@/lib/services/abates.services";
import { subscribeToAllProducao } from "@/lib/services/producao.services";
import { subscribeToAllProducts } from "@/lib/services/produtos.services";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PackageSearch } from "lucide-react";
import { useDataStore } from "@/store/data.store";
import { formatCurrency, formatNumber } from "@/lib/utils/formatters";

interface ProgressoMeta {
  produtoNome: string;
  unidade: string;
  meta: number;
  realizado: number;
  progresso: number;
  perda: number;
  valorRealizado: number;
  valorPerda: number;
}

export default function MetasPage() {
  const [lotes, setLotes] = useState<Abate[]>([]);
  const [producao, setProducao] = useState<Producao[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { unidades } = useDataStore();

  useEffect(() => {
    setIsLoading(true);
    const unsubLotes = subscribeToAbates(setLotes, true);
    const unsubProducao = subscribeToAllProducao(setProducao);
    const unsubProdutos = subscribeToAllProducts(setProdutos);

    // Garante que os dados básicos sejam carregados antes de remover o loading
    const timer = setTimeout(() => setIsLoading(false), 500);

    return () => {
      unsubLotes();
      unsubProducao();
      unsubProdutos();
      clearTimeout(timer);
    };
  }, []);

  const produtosComMeta = useMemo(() => {
    return produtos.filter(
      (p): p is ProdutoVenda | ProdutoMateriaPrima =>
        (p.tipoProduto === 'VENDA' || p.tipoProduto === 'MATERIA_PRIMA') &&
        'metaPorAnimal' in p &&
        typeof p.metaPorAnimal === 'number' &&
        p.metaPorAnimal > 0
    );
  }, [produtos]);

  const calcularProgressoDoLote = (lote: Abate): ProgressoMeta[] => {
    const producaoDoLote = producao.filter(p => p.abateId === lote.id);

    return produtosComMeta.map(produto => {
      const unidade = unidades.find(u => u.id === produto.unidadeId)?.sigla || 'un';
      const metaTeorica = (lote.numeroAnimais - (lote.condenado || 0)) * (produto.metaPorAnimal || 0);

      const totalProduzido = producaoDoLote.reduce((acc, prod) => {
        const item = prod.produtos.find(item => item.produtoId === produto.id);
        return acc + (item ? item.quantidade : 0);
      }, 0);

      const perdaRegistrada = producaoDoLote.reduce((acc, prod) => {
          const item = prod.produtos.find(item => item.produtoId === produto.id);
          return acc + (item ? (item.perda || 0) : 0);
      }, 0);

      const progressoPercentual = metaTeorica > 0 ? (totalProduzido / metaTeorica) * 100 : 0;

      const valorRealizado = totalProduzido * ((produto as ProdutoVenda).precoVenda || produto.custoUnitario || 0);
      const valorPerda = perdaRegistrada * (produto.custoUnitario || 0);

      return {
        produtoNome: produto.nome,
        unidade,
        meta: metaTeorica,
        realizado: totalProduzido,
        progresso: Math.min(progressoPercentual, 100),
        perda: perdaRegistrada,
        valorRealizado,
        valorPerda,
      };
    }).filter(p => p.meta > 0); // Mostra apenas produtos que têm meta para o lote
  };

  const lotesAtivos = lotes.filter(l => l.status === 'Aguardando Processamento' || l.status === 'Em Processamento');

  if (isLoading) {
      return <div className="flex justify-center items-center h-64"><p>Carregando painel de metas...</p></div>;
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Painel de Metas e Produção</h1>
        <p className="text-muted-foreground">
          Acompanhe a eficiência e o progresso de cada lote de abate em tempo real.
        </p>
      </div>
      <Separator />

      {lotesAtivos.length === 0 && !isLoading && (
        <Alert>
            <PackageSearch className="h-4 w-4" />
            <AlertTitle>Nenhum lote em produção!</AlertTitle>
            <AlertDescription>
                Não há lotes com status "Aguardando Processamento" ou "Em Processamento". Inicie um novo <a href="/dashboard/abates" className="font-bold text-primary hover:underline">Lançamento de Abate</a> para começar.
            </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {lotesAtivos.map((lote) => {
          const progressoLote = calcularProgressoDoLote(lote);
          const totalValorRealizado = progressoLote.reduce((acc, p) => acc + p.valorRealizado, 0);
          const totalValorPerdido = progressoLote.reduce((acc, p) => acc + p.valorPerda, 0);
          const eficiencia = totalValorRealizado + totalValorPerdido > 0 ? (totalValorRealizado / (totalValorRealizado + totalValorPerdido)) * 100 : 100;

          return (
            <Card key={lote.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="tracking-tight">{lote.loteId}</CardTitle>
                <CardDescription>{lote.numeroAnimais} animais ({lote.condenado || 0} condenados) - Custo: {formatCurrency(lote.custoTotal || 0)}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                {progressoLote.map((meta, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <h4 className="font-semibold">{meta.produtoNome}</h4>
                      <span className="text-sm text-muted-foreground">
                        {formatNumber(meta.realizado)} / {formatNumber(meta.meta)} <span className="text-xs">{meta.unidade}</span>
                      </span>
                    </div>
                    <Progress value={meta.progresso} />
                    {meta.perda > 0 && <p className="text-xs text-right text-destructive">Perda: {formatNumber(meta.perda)} {meta.unidade} ({formatCurrency(meta.valorPerda)})</p>}
                  </div>
                ))}
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 pt-4 border-t">
                  <div className="w-full flex justify-between text-sm font-semibold">
                      <span>Eficiência do Lote:</span>
                      <span className={eficiencia < 70 ? 'text-destructive' : eficiencia < 90 ? 'text-amber-500' : 'text-green-500'}>{eficiencia.toFixed(1)}%</span>
                  </div>
                  <div className="w-full flex justify-between text-xs text-muted-foreground">
                      <span>Valor Produzido (Venda):</span>
                      <span>{formatCurrency(totalValorRealizado)}</span>
                  </div>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </motion.div>
  );
}
