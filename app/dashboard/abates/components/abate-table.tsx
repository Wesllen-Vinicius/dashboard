'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { ColumnDef, Row, ExpandedState, OnChangeFn } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import {
  IconPencil,
  IconTrash,
  IconRotateClockwise,
  IconChevronDown,
} from '@tabler/icons-react';

import { Abate, Fornecedor } from '@/lib/schemas';
import { useAuthStore } from '@/store/auth.store';
import { useDataStore } from '@/store/data.store';

import { GenericTable } from '@/components/generic-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { DetailsSubRow } from '@/components/details-sub-row';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/formatters';

type BadgeVariant = React.ComponentProps<typeof Badge>['variant'];

type AbateComDetalhes = Abate & {
  fornecedorNome: string;
  registradorNome: string;
};

interface AbateTableProps {
  abates: Abate[];
  fornecedores: Fornecedor[];
  isLoading: boolean;
  onEdit: (abate: Abate) => void;
  onDelete: (id: string) => void;
  onReactivate: (id: string) => void;
  expanded: ExpandedState;
  onExpandedChange: OnChangeFn<ExpandedState>;
}

export function AbateTable({
  abates,
  fornecedores,
  isLoading,
  onEdit,
  onDelete,
  onReactivate,
  expanded,
  onExpandedChange,
}: AbateTableProps) {
  const { user } = useAuthStore();
  const { users } = useDataStore();
  const currentUser = React.useMemo(
    () => users.find(u => u.uid === user?.uid),
    [users, user]
  );
  const isAdmin = currentUser?.role === 'ADMINISTRADOR';

  const abatesEnriquecidos = React.useMemo<AbateComDetalhes[]>(
    () =>
      abates.map(abate => ({
        ...abate,
        fornecedorNome:
          fornecedores.find(f => f.id === abate.fornecedorId)
            ?.nomeRazaoSocial ?? 'N/A',
        registradorNome: abate.registradoPor.nome,
      })),
    [abates, fornecedores]
  );

  const renderSubComponent = React.useCallback(
    ({ row }: { row: Row<AbateComDetalhes> }) => {
      const abate = row.original;
      const details = [
        { label: 'ID do Registro', value: abate.id! },
        { label: 'Fornecedor', value: abate.fornecedorNome },
        {
          label: 'Custo por Animal',
          value: formatCurrency(abate.custoPorAnimal),
        },
        {
          label: 'Custo Total do Lote',
          value: formatCurrency(abate.custoTotal),
        },
        { label: 'Registrado Por', value: abate.registradorNome },
        {
          label: 'Data do Registro',
          value:
            abate.createdAt instanceof Timestamp
              ? format(abate.createdAt.toDate(), "dd/MM/yyyy 'às' HH:mm:ss")
              : 'N/A',
        },
      ];
      return <DetailsSubRow details={details} />;
    },
    []
  );

  const getStatusInfo = (
    status: Abate['status']
  ): { text: string; variant: BadgeVariant } => {
    switch (status) {
      case 'Finalizado':
        return { text: 'Finalizado', variant: 'success' };
      case 'Em Processamento':
        return { text: 'Em Processamento', variant: 'warning' };
      case 'Aguardando Processamento':
        return { text: 'Aguardando', variant: 'default' };
      case 'Cancelado':
        return { text: 'Cancelado', variant: 'destructive' };
      default:
        return { text: status ?? 'Desconhecido', variant: 'outline' };
    }
  };

  const columns = React.useMemo<ColumnDef<AbateComDetalhes>[]>(
    () => [
      {
        id: 'expander',
        header: () => null,
        cell: ({ row }) => {
          const isExpanded = row.getIsExpanded();
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={row.getToggleExpandedHandler()}
                  >
                    <IconChevronDown
                      className={cn(
                        'h-5 w-5 transition-transform duration-200',
                        isExpanded && 'rotate-180'
                      )}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{isExpanded ? 'Ocultar Detalhes' : 'Ver Detalhes'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        },
      },
      {
        accessorKey: 'data',
        header: 'Data',
        cell: ({ row }) => format(new Date(row.original.data), 'dd/MM/yyyy'),
      },
      { accessorKey: 'loteId', header: 'Lote' },
      { accessorKey: 'fornecedorNome', header: 'Fornecedor' },
      { accessorKey: 'numeroAnimais', header: 'Nº Animais' },
      { accessorKey: 'condenado', header: 'Condenado' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const info = getStatusInfo(row.original.status);
          return <Badge variant={info.variant}>{info.text}</Badge>;
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const abate = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <span className="sr-only">Abrir menu</span>
                  <IconPencil className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem onClick={() => onEdit(abate)}>
                    <IconPencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                )}
                {abate.status !== 'Cancelado' ? (
                  <DropdownMenuItem
                    onClick={() => onDelete(abate.id!)}
                    className="text-red-600"
                  >
                    <IconTrash className="mr-2 h-4 w-4" />
                    Cancelar
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => onReactivate(abate.id!)}
                    className="text-green-600"
                  >
                    <IconRotateClockwise className="mr-2 h-4 w-4" />
                    Reativar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [isAdmin, onEdit, onDelete, onReactivate]
  );

  if (isLoading) {
    return (
      <div className="space-y-2 mt-4">
        {[...Array(8)].map((_, idx) => (
          <Skeleton key={idx} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <GenericTable
        columns={columns}
        data={abatesEnriquecidos}
        filterPlaceholder="Pesquisar por Lote ou Fornecedor..."
        filterColumnId="loteId"
        renderSubComponent={renderSubComponent}
        expanded={expanded}
        onExpandedChange={onExpandedChange}
      />
    </motion.div>
  );
}
