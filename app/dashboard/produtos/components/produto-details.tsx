"use client";

import { Produto } from "@/lib/schemas";
import { formatCurrency } from "@/lib/utils/formatters";

interface ProdutoDetailsProps {
  produto: Produto;
}

const DetailItem = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium">{value || "---"}</p>
  </div>
);

export function ProdutoDetails({ produto }: ProdutoDetailsProps) {
  return (
    <div className="p-4 bg-muted/50 grid grid-cols-2 md:grid-cols-4 gap-4">
        <DetailItem label="Código Interno" value={produto.id} />
        <DetailItem label="Custo Unitário" value={formatCurrency(produto.custoUnitario)} />

        {produto.tipoProduto === 'VENDA' && (
            <>
                <DetailItem label="Preço de Venda" value={formatCurrency(produto.precoVenda)} />
                <DetailItem label="SKU" value={produto.sku} />
                <div className="col-span-2 md:col-span-4 border-t my-2"></div>
                <h4 className="text-sm font-semibold mb-2 col-span-full">Informações Fiscais</h4>
                <DetailItem label="NCM" value={produto.ncm} />
                <DetailItem label="CFOP" value={produto.cfop} />
                <DetailItem label="CEST" value={produto.cest} />
            </>
        )}

        {produto.tipoProduto === 'USO_INTERNO' && (
            <DetailItem label="Categoria" value={produto.categoriaNome} />
        )}
    </div>
  );
}
