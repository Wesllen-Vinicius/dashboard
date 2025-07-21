"use client";

import { useMemo, useCallback } from "react";
import { ColumnDef, Row, ExpandedState, OnChangeFn } from "@tanstack/react-table";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { motion } from "framer-motion";
import { IconPencil, IconTrash, IconRotateClockwise, IconChevronDown } from "@tabler/icons-react";

import { Abate, Funcionario, Compra } from "@/lib/schemas";
import { useAuthStore } from "@/store/auth.store";
import { useDataStore } from "@/store/data.store";

import { GenericTable } from "@/components/generic-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DetailsSubRow } from "@/components/details-sub-row";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";


type AbateComDetalhes = Abate & {
  responsavelNome?: string;
  registradorNome?: string;
  compraRef?: string;
};

interface AbateTableProps {
  abates: Abate[];
  isLoading: boolean;
  onEdit: (abate: Abate) => void;
  onDelete: (id: string) => void;
  onReactivate: (id: string) => void;
  expanded: ExpandedState;
  onExpandedChange: OnChangeFn<ExpandedState>;
}

export function AbateTable({
  abates,
  isLoading,
  onEdit,
  onDelete,
  onReactivate,
  expanded,
  onExpandedChange,
}: AbateTableProps) {
  const { user } = useAuthStore();
  const { funcionarios, users, compras } = useDataStore();
  const currentUserProfile = useMemo(
    () => users.find((u) => u.uid === user?.uid),
    [users, user]
  );
  const role = currentUserProfile?.role;

  const abatesEnriquecidos: AbateComDetalhes[] = useMemo(() => {
    return abates.map(abate => ({
      ...abate,
      responsavelNome: funcionarios.find(f => f.id === abate.responsavelId)?.nomeCompleto || 'N/A',
      registradorNome: abate.registradoPor.nome || 'N/A',
      compraRef: compras.find(c => c.id === abate.compraId)?.notaFiscal || 'N/A',
    }));
  }, [abates, funcionarios, compras]);

  const renderSubComponent = useCallback(({ row }: { row: Row<AbateComDetalhes> }) => {
    const abate = row.original;
    const details = [
        { label: "ID do Registro", value: abate.id },
        { label: "Responsável pelo Abate", value: abate.responsavelNome },
        { label: "Registrado Por", value: abate.registradorNome },
        {
            label: "Data do Registro",
            value: (abate.createdAt && abate.createdAt instanceof Timestamp)
                ? format(abate.createdAt.toDate(), "dd/MM/yyyy 'às' HH:mm:ss")
                : "N/A"
        },
    ];
    return <DetailsSubRow details={details} />;
  }, []);

  const columns: ColumnDef<AbateComDetalhes>[] = useMemo(() => [
    {
      id: 'expander',
      header: () => null,
      cell: ({ row }) => {
        const isExpanded = row.getIsExpanded();
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={row.getToggleExpandedHandler()}>
                  <IconChevronDown className={cn("h-5 w-5 transition-transform duration-200", isExpanded && "rotate-180")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right"><p>{isExpanded ? "Ocultar Detalhes" : "Ver Detalhes"}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    { accessorKey: "data", header: "Data", cell: ({ row }) => format(new Date(row.original.data), "dd/MM/yyyy") },
    { accessorKey: "compraRef", header: "Ref. Compra (NF)" },
    { accessorKey: "total", header: "Total Abatido" },
    { accessorKey: "condenado", header: "Condenado" },
    {
        header: "Rendimento",
        cell: ({ row }) => {
          const rendimento = row.original.total > 0 ? ((row.original.total - row.original.condenado) / row.original.total) * 100 : 0;
          return <Badge variant={rendimento < 95 ? "destructive" : "success"}>{rendimento.toFixed(1)}%</Badge>;
        }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (<Badge variant={row.original.status === 'ativo' ? 'success' : 'destructive'}>{row.original.status === 'ativo' ? 'Ativo' : 'Inativo'}</Badge>)
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const item = row.original;
        const podeEditar = role === 'ADMINISTRADOR';
        return (
          <div className="flex justify-end gap-2">
            <TooltipProvider>
              {item.status === 'ativo' ? (
                <>
                  <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => onEdit(item)} disabled={!podeEditar}><IconPencil className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Editar</p></TooltipContent></Tooltip>
                  <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(item.id!)} disabled={!podeEditar}><IconTrash className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Inativar</p></TooltipContent></Tooltip>
                </>
              ) : (
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => onReactivate(item.id!)} disabled={!podeEditar}><IconRotateClockwise className="h-4 w-4 text-green-500" /></Button></TooltipTrigger><TooltipContent><p>Reativar</p></TooltipContent></Tooltip>
              )}
            </TooltipProvider>
          </div>
        );
      },
    },
  ], [role, onEdit, onDelete, onReactivate]);

  if (isLoading) {
    return <div className="space-y-2 mt-4">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <GenericTable
        columns={columns}
        data={abatesEnriquecidos}
        filterPlaceholder="Pesquisar por NF..."
        filterColumnId="compraRef"
        renderSubComponent={renderSubComponent}
        expanded={expanded}
        onExpandedChange={onExpandedChange}
      />
    </motion.div>
  );
}
