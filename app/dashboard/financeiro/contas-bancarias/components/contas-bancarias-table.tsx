"use client";

import { useMemo, useCallback } from "react";
import { ColumnDef, Row, ExpandedState, OnChangeFn } from "@tanstack/react-table";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { motion } from "framer-motion";
import { IconPencil, IconTrash, IconRotateClockwise, IconListDetails } from "@tabler/icons-react";
import { ContaBancaria } from "@/lib/schemas";
import { useAuthStore } from "@/store/auth.store";
import { useDataStore } from "@/store/data.store";
import { GenericTable } from "@/components/generic-table";
import { DetailsSubRow } from "@/components/details-sub-row";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TableProps {
  contas: ContaBancaria[];
  isLoading: boolean;
  onEdit: (conta: ContaBancaria) => void;
  onDelete: (id: string) => void;
  onReactivate: (id: string) => void;
  expanded: ExpandedState;
  onExpandedChange: OnChangeFn<ExpandedState>;
}

export function ContasBancariasTable({
  contas,
  isLoading,
  onEdit,
  onDelete,
  onReactivate,
  expanded,
  onExpandedChange,
}: TableProps) {
  const { user } = useAuthStore();
  const { users } = useDataStore();
  const currentUserProfile = useMemo(() =>
    users.find((u) => u.uid === user?.uid), [users, user]);
  const role = currentUserProfile?.role;

  const renderSubComponent = useCallback(({ row }: { row: Row<ContaBancaria> }) => {
    const conta = row.original;
    const details = [
        { label: "ID do Registro", value: conta.id, className: "col-span-1 sm:col-span-2" },
        { label: "Tipo de Conta", value: conta.tipo },
        { label: "Agência", value: conta.agencia || "N/A" },
        { label: "Conta", value: conta.conta || "N/A" },
        {
            label: "Data de Criação",
            value:
              conta.createdAt && conta.createdAt instanceof Timestamp
                ? format(conta.createdAt.toDate(), "dd/MM/yyyy 'às' HH:mm:ss")
                : "N/A",
        },
        {
            label: "Saldo Inicial",
            value: (conta.saldoInicial ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        },
    ];
    return <DetailsSubRow details={details} />;
  }, []);

  const columns: ColumnDef<ContaBancaria>[] = useMemo(
    () => [
      {
        id: "expander",
        header: () => null,
        cell: ({ row }) => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={row.getToggleExpandedHandler()}>
                  <IconListDetails className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Ver Detalhes</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
      },
      {
        accessorKey: "nomeConta",
        header: "Nome da Conta",
        cell: ({ row }) => (
          <span className={cn(row.original.status === "inativa" && "text-muted-foreground")}>
            {row.getValue("nomeConta")}
          </span>
        ),
      },
      {
        accessorKey: "banco",
        header: "Banco"
      },
      {
        accessorKey: "saldoAtual",
        header: "Saldo Atual",
        cell: ({ row }) => (row.original.saldoAtual ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.status === "ativa" ? "success" : "destructive"}>
            {row.original.status === "ativa" ? "Ativa" : "Inativa"}
          </Badge>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const item = row.original;
          const podeEditar = role === "ADMINISTRADOR";
          return (
            <div className="flex justify-end gap-2">
              <TooltipProvider>
                {item.status === "ativa" ? (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onEdit(item)} disabled={!podeEditar}>
                          <IconPencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Editar</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(item.id!)} disabled={!podeEditar}>
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Inativar</p></TooltipContent>
                    </Tooltip>
                  </>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => onReactivate(item.id!)} disabled={!podeEditar}>
                        <IconRotateClockwise className="h-4 w-4 text-green-500" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Reativar</p></TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
          );
        },
      },
    ],
    [role, onEdit, onDelete, onReactivate]
  );

  if (isLoading) {
    return (
      <div className="space-y-2 mt-4">
        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <GenericTable
        columns={columns}
        data={contas}
        filterPlaceholder="Pesquisar por nome da conta..."
        filterColumnId="nomeConta"
        renderSubComponent={renderSubComponent}
        expanded={expanded}
        onExpandedChange={onExpandedChange}
      />
    </motion.div>
  );
}
