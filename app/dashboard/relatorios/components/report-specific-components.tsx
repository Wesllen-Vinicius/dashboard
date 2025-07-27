"use client";

import { Row } from "@tanstack/react-table";
import { useDataStore } from "@/store/data.store";
import { Progress } from "@/components/ui/progress";
import { Producao, Venda, Compra } from "@/lib/schemas";

type EnrichedProducao = Producao & { responsavelNome?: string; registradoPorNome?: string; };
type EnrichedVenda = Venda & { clienteNome?: string };
type EnrichedCompra = Compra & { fornecedorNome?: string };

interface SummaryProps {
    summary: { totalProduzido: number; totalPerdas: number; totalBruto: number; rendimento: number };
}

interface SubComponentProps<TData> {
    row: Row<TData>;
}

export const ProductionReportSummary = ({ summary }: SummaryProps) => (
    <div className="mb-6 space-y-4 rounded-lg border bg-muted/50 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="rounded-lg border bg-card p-3">
                <p className="text-sm text-muted-foreground">Total Produzido</p>
                <p className="text-xl font-bold text-green-500">{summary.totalProduzido.toFixed(2)} kg</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
                <p className="text-sm text-muted-foreground">Total de Perdas</p>
                <p className="text-xl font-bold text-destructive">{summary.totalPerdas.toFixed(2)} kg</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
                <p className="text-sm text-muted-foreground">Peso Total (Bruto)</p>
                <p className="text-xl font-bold">{summary.totalBruto.toFixed(2)} kg</p>
            </div>
        </div>
        <div>
            <div className="flex justify-between mb-1">
                <span className="text-base font-medium text-muted-foreground">Rendimento Geral</span>
                <span className="text-base font-bold text-primary">{summary.rendimento.toFixed(1)}%</span>
            </div>
            <Progress value={summary.rendimento} className="h-3" />
        </div>
    </div>
);

export const renderSubComponentProducao = ({ row }: SubComponentProps<EnrichedProducao>) => {
    const { unidades, produtos } = useDataStore.getState();
    return (
        <div className="p-4 bg-muted/20">
            <h4 className="font-semibold text-sm mb-2">Produtos do Lote: {row.original.lote}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {row.original.produtos.map((p, i) => {
                    const produtoInfo = produtos.find(prod => prod.id === p.produtoId);
                    const unidadeNome = produtoInfo?.tipoProduto === 'VENDA' && produtoInfo.unidadeId
                        ? unidades.find(u => u.id === produtoInfo.unidadeId)?.sigla || 'un'
                        : 'un';
                    return (
                        <div key={i} className="text-xs p-2.5 border rounded-lg bg-background shadow-sm">
                            <p className="font-bold text-sm mb-1">{p.produtoNome}</p>
                            <p><strong>Produzido:</strong> {p.quantidade.toFixed(2)} {unidadeNome}</p>
                            <p className="text-destructive/80"><strong>Perda:</strong> {(p.perda || 0).toFixed(2)} {unidadeNome}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const renderSubComponentVendas = ({ row }: SubComponentProps<EnrichedVenda>) => {
    return (
        <div className="p-4 bg-muted/20">
            <h4 className="font-semibold text-sm mb-2">Itens da Venda</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {row.original.produtos.map((p, i) => (
                    <div key={i} className="text-xs p-2.5 border rounded-lg bg-background shadow-sm">
                        <p className="font-bold text-sm mb-1">{p.produtoNome}</p>
                        <p><strong>Qtd:</strong> {p.quantidade}</p>
                        <p><strong>Preço Un.:</strong> R$ {p.precoUnitario.toFixed(2)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const renderSubComponentCompras = ({ row }: SubComponentProps<EnrichedCompra>) => {
    return (
        <div className="p-4 bg-muted/20">
            <h4 className="font-semibold text-sm mb-2">Itens da Compra (NF: {row.original.notaFiscal})</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {row.original.itens.map((p, i) => (
                    <div key={i} className="text-xs p-2.5 border rounded-lg bg-background shadow-sm">
                        <p className="font-bold text-sm mb-1">{p.produtoNome}</p>
                        <p><strong>Qtd:</strong> {p.quantidade}</p>
                        <p><strong>Custo Un.:</strong> R$ {p.custoUnitario.toFixed(2)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
