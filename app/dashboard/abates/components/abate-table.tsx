"use client";

import { useMemo, useCallback } from "react";
import { ColumnDef, Row } from "@tanstack/react-table";
import { format } from "date-fns";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import { Timestamp } from "firebase/firestore";
import { motion } from "framer-motion";

import { Abate } from "@/lib/schemas";
import { useAuthStore } from "@/store/auth.store";
import { useDataStore } from "@/store/data.store";

import { GenericTable } from "@/components/generic-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DetailsSubRow } from "@/components/details-sub-row";
import { Skeleton } from "@/components/ui/skeleton";

type AbateComDetalhes = Abate & { responsavelNome?: string; registradorNome?: string; };

interface AbateTableProps {
  abates: Abate[];
  isLoading: boolean;
  onEdit: (abate: Abate) => void;
  onDelete: (id: string) => void;
}

export function AbateTable({ abates, isLoading, onEdit, onDelete }: AbateTableProps) {
  const { user, role } = useAuthStore();
  const { funcionarios, users, compras } = useDataStore();

  const abatesEnriquecidos: AbateComDetalhes[] = useMemo(() => {
    return abates.map(abate => ({
      ...abate,
      responsavelNome: funcionarios.find(f => f.id === abate.responsavelId)?.nomeCompleto || 'N/A',
      registradorNome: abate.registradoPor.nome || 'N/A',
    }));
  }, [abates, funcionarios]);

  const renderSubComponent = useCallback(({ row }: { row: Row<AbateComDetalhes> }) => {
    const abate = row.original;
    const compraRef = compras.find(c => c.id === abate.compraId);
    const details = [
        { label: "Responsável", value: abate.responsavelNome },
        { label: "Registrado Por", value: abate.registradorNome },
        { label: "Ref. Compra", value: compraRef ? `NF ${compraRef.notaFiscal}` : 'N/A' },
        { label: "Data do Registro", value: abate.createdAt ? format((abate.createdAt as Timestamp).toDate(), 'dd/MM/yyyy HH:mm') : 'N/A' },
    ];
    return <DetailsSubRow details={details} />;
  }, [compras]);

  const columns: ColumnDef<AbateComDetalhes>[] = [
    { accessorKey: "data", header: "Data", cell: ({ row }) => format(new Date(row.original.data), "dd/MM/yyyy") },
    { accessorKey: "total", header: "Total" },
    { accessorKey: "condenado", header: "Condenado" },
    { header: "Rendimento", cell: ({ row }) => {
        const rendimento = row.original.total > 0 ? ((row.original.total - row.original.condenado) / row.original.total) * 100 : 0;
        return <Badge variant={rendimento < 95 ? "destructive" : "default"}>{rendimento.toFixed(1)}%</Badge>
      }
    },
    { accessorKey: "responsavelNome", header: "Responsável" },
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
        data={abatesEnriquecidos}
        filterPlaceholder="Pesquisar por responsável..."
        filterColumnId="responsavelNome"
        renderSubComponent={renderSubComponent}
      />
    </motion.div>
  );
}
