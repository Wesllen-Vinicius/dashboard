"use client";

import { useMemo, useCallback } from "react";
import { ColumnDef, Row, ExpandedState, OnChangeFn } from "@tanstack/react-table";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { motion } from "framer-motion";
import { IconPencil, IconTrash, IconRotateClockwise, IconListDetails } from "@tabler/icons-react";
import { Unidade } from "@/lib/schemas";
import { useAuthStore } from "@/store/auth.store";
import { useDataStore } from "@/store/data.store";
import { GenericTable } from "@/components/generic-table";
import { DetailsSubRow } from "@/components/details-sub-row";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UnidadeTableProps {
  unidades: Unidade[];
  isLoading: boolean;
  onEdit: (unidade: Unidade) => void;
  onDelete: (id: string) => void;
  onReactivate: (id: string) => void;
  expanded: ExpandedState;
  onExpandedChange: OnChangeFn<ExpandedState>;
}

export function UnidadeTable({ unidades, isLoading, onEdit, onDelete, onReactivate, expanded, onExpandedChange }: UnidadeTableProps) {
  const { user } = useAuthStore();
  const { users } = useDataStore();
  const currentUserProfile = useMemo(() => users.find(u => u.uid === user?.uid), [users, user]);
  const role = currentUserProfile?.role;

  const renderSubComponent = useCallback(({ row }: { row: Row<Unidade> }) => {
    const unidade = row.original;
    const details = [
        { label: "ID do Registro", value: unidade.id, className: "col-span-1 sm:col-span-2" },
        {
            label: "Data/Hora de Criação",
            value: (unidade.createdAt && unidade.createdAt instanceof Timestamp)
                ? format(unidade.createdAt.toDate(), "dd/MM/yyyy 'às' HH:mm:ss")
                : "N/A"
        },
    ];
    return <DetailsSubRow details={details} />;
  }, []);

  const columns: ColumnDef<Unidade>[] = useMemo(() => [
    {
      id: 'expander',
      header: () => null,
      cell: ({ row }) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={row.getToggleExpandedHandler()} disabled={!row.getCanExpand()}>
                <IconListDetails className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Ver Detalhes</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
    },
    { accessorKey: "nome", header: "Nome da Unidade", cell: ({ row }) => (<span className={cn(row.original.status === 'inativo' && 'text-muted-foreground')}>{row.getValue("nome")}</span>) },
    { accessorKey: "sigla", header: "Sigla", cell: ({ row }) => (<span className={cn(row.original.status === 'inativo' && 'text-muted-foreground')}>{row.getValue("sigla")}</span>) },
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
      <GenericTable columns={columns} data={unidades} filterPlaceholder="Pesquisar por nome ou sigla..." filterColumnId="nome" renderSubComponent={renderSubComponent} expanded={expanded} onExpandedChange={onExpandedChange} />
    </motion.div>
  );
}
