'use client';

import { ColumnDef, ExpandedState, OnChangeFn } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GenericTable } from '@/components/generic-table';
import { Compra, Fornecedor } from '@/lib/schemas';
import { formatCurrency } from '@/lib/utils/formatters';

interface CompraTableProps {
  data: Compra[];
  fornecedores: Fornecedor[];
  onEdit: (compra: Compra) => void;
  onSetStatus: (id: string, status: 'ativo' | 'inativo') => void;
  expanded: ExpandedState;
  onExpandedChange: OnChangeFn<ExpandedState>;
}

const getFornecedorNome = (id: string, fornecedores: Fornecedor[]) => {
  return fornecedores.find(f => f.id === id)?.nomeRazaoSocial || 'Não encontrado';
};

export function CompraTable({ data, fornecedores, onEdit, onSetStatus, expanded, onExpandedChange }: CompraTableProps) {
  const columns: ColumnDef<Compra>[] = [
    {
      id: 'expander',
      header: () => null,
      cell: ({ row }) => row.getCanExpand() ? (
        <button {...{ onClick: row.getToggleExpandedHandler(), style: { cursor: 'pointer' } }}>
          {row.getIsExpanded() ? '👇' : '👉'}
        </button>
      ) : null,
    },
    {
      accessorKey: 'notaFiscal',
      header: 'Nota Fiscal',
    },
    {
      accessorKey: 'data',
      header: 'Data da Compra',
      cell: ({ row }) => format(new Date(row.original.data), 'dd/MM/yyyy'),
    },
    {
      accessorKey: 'fornecedorId',
      header: 'Fornecedor',
      cell: ({ row }) => getFornecedorNome(row.original.fornecedorId, fornecedores),
    },
    {
      accessorKey: 'valorTotal',
      header: 'Valor Total',
      cell: ({ row }) => formatCurrency(row.original.valorTotal),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'ativo' ? 'success' : 'destructive'}>
          {row.original.status === 'ativo' ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const compra = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {compra.status === 'ativo' ? (
                <>
                  <DropdownMenuItem onClick={() => onEdit(compra)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSetStatus(compra.id!, 'inativo')} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Inativar
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => onSetStatus(compra.id!, 'ativo')} className="text-green-600">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reativar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const renderSubComponent = ({ row }: { row: any }) => (
    <div className="bg-gray-100 dark:bg-gray-800 p-4">
      <h4 className="font-semibold mb-2">Itens da Compra:</h4>
      <ul className="list-disc pl-5">
        {row.original.itens.map((item: any, index: number) => (
          <li key={index}>
            {item.quantidade} x {item.produtoNome} - {formatCurrency(item.custoUnitario)} cada
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <GenericTable
      columns={columns}
      data={data}
      renderSubComponent={renderSubComponent}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
    />
  );
}
