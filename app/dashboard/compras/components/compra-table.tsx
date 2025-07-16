"use client";

import { useMemo, useCallback } from "react";
import { ColumnDef, Row } from "@tanstack/react-table";
import { format } from "date-fns";
import { IconPencil, IconTrash, IconListDetails } from "@tabler/icons-react";
import { Timestamp } from "firebase/firestore";
import { motion } from "framer-motion";

import { Compra, UserInfo } from "@/lib/schemas";
import { useAuthStore } from "@/store/auth.store";
import { useDataStore } from "@/store/data.store";

import { GenericTable } from "@/components/generic-table";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DetailsSubRow } from "@/components/details-sub-row";
import { Skeleton } from "@/components/ui/skeleton";

type CompraComDetalhes = Compra & {
  fornecedorNome?: string;
  registradoPor: UserInfo;
};

interface CompraTableProps {
  compras: Compra[];
  isLoading: boolean;
  onEdit: (compra: Compra) => void;
  onDelete: (id: string) => void;
}

export function CompraTable({ compras, isLoading, onEdit, onDelete }: CompraTableProps) {
  const { role } = useAuthStore();
  const { fornecedores } = useDataStore();

  const comprasEnriquecidas: CompraComDetalhes[] = useMemo(() => {
    return compras.map(compra => ({
      ...compra,
      fornecedorNome: fornecedores.find(f => f.id === compra.fornecedorId)?.razaoSocial || 'N/A',
    })) as CompraComDetalhes[];
  }, [compras, fornecedores]);

  const renderSubComponent = useCallback(({ row }: { row: Row<CompraComDetalhes> }) => {
    const compra = row.original;
    const details = [
        { label: "Nota Fiscal", value: compra.notaFiscal },
        { label: "Cond. Pagamento", value: compra.condicaoPagamento.replace('_', ' ') },
        { label: "Registrado Por", value: compra.registradoPor?.nome || 'N/A' },
        { label: "Data do Registro", value: compra.createdAt ? format((compra.createdAt as Timestamp).toDate(), 'dd/MM/yyyy HH:mm') : 'N/A' },
    ];

    return (
        <div className="p-4 bg-muted/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <DetailsSubRow details={details} />
                <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2"><IconListDetails size={16}/> Itens da Compra:</h4>
                    <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
                        {compra.itens.map((item, index) => (
                            <div key={index} className="flex justify-between items-center text-sm py-1 px-2 hover:bg-background rounded-md">
                                <span>{item.quantidade}x {item.produtoNome}</span>
                                <span className="font-mono">
                                    {(item.quantidade * item.custoUnitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
  }, []);

  // CORREÇÃO: A coluna 'expander' manual foi removida daqui.
  const columns: ColumnDef<CompraComDetalhes>[] = [
    { accessorKey: "data", header: "Data", cell: ({ row }) => format(new Date(row.original.data), "dd/MM/yyyy") },
    { accessorKey: "fornecedorNome", header: "Fornecedor" },
    { accessorKey: "notaFiscal", header: "Nota Fiscal", cell: ({ row }) => <span className="font-mono">{row.original.notaFiscal}</span> },
    { accessorKey: "valorTotal", header: () => <div className="text-right">Valor Total</div>, cell: ({ row }) => <div className="text-right font-medium">{row.original.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div> },
    { id: "actions", cell: ({ row }) => {
        const item = row.original;
        const podeEditar = role === 'ADMINISTRADOR';
        return (
            <div className="flex justify-end gap-2">
                <TooltipProvider>
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => onEdit(item)} disabled={!podeEditar}><IconPencil className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Editar</p></TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(item.id!)} disabled={!podeEditar}><IconTrash className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Inativar</p></TooltipContent></Tooltip>
                </TooltipProvider>
            </div>
        );
      }
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-2 mt-4">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <GenericTable
        columns={columns}
        data={comprasEnriquecidas}
        filterPlaceholder="Pesquisar por fornecedor..."
        filterColumnId="fornecedorNome"
        renderSubComponent={renderSubComponent}
      />
    </motion.div>
  );
}
