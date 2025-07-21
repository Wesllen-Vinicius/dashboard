'use client';

import { ColumnDef, ExpandedState, OnChangeFn } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { GenericTable } from '@/components/generic-table';
import { Produto, Unidade } from '@/lib/schemas';
import { formatCurrency } from '@/lib/utils/formatters';

interface ProdutosTableProps {
  data: Produto[];
  unidades: Unidade[];
  onEdit: (produto: Produto) => void;
  onSetStatus: (id: string, status: 'ativo' | 'inativo') => void;
  expanded: ExpandedState;
  onExpandedChange: OnChangeFn<ExpandedState>;
}

const getUnidadeSigla = (id: string | undefined, unidades: Unidade[]) => {
    if (!id) return '-';
    return unidades.find(u => u.id === id)?.sigla || 'N/A';
};

const getTipoProdutoLabel = (tipo: Produto['tipoProduto']) => {
    switch (tipo) {
        case 'VENDA': return 'Venda';
        case 'USO_INTERNO': return 'Uso Interno';
        case 'MATERIA_PRIMA': return 'Matéria-Prima';
        default: return 'Desconhecido';
    }
};

export function ProdutosTable({ data, unidades, onEdit, onSetStatus, expanded, onExpandedChange }: ProdutosTableProps) {
  const columns: ColumnDef<Produto>[] = [
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
      accessorKey: 'nome',
      header: 'Nome',
    },
    {
        accessorKey: 'tipoProduto',
        header: 'Tipo',
        cell: ({ row }) => getTipoProdutoLabel(row.original.tipoProduto),
    },
    {
        accessorKey: 'quantidade',
        header: 'Estoque',
        cell: ({ row }) => {
            const produto = row.original;
            const sigla = produto.tipoProduto !== 'USO_INTERNO' ? getUnidadeSigla(produto.unidadeId, unidades) : '';
            return `${produto.quantidade || 0} ${sigla}`;
        }
    },
    {
        accessorKey: 'custoUnitario',
        header: 'Custo Unitário',
        cell: ({ row }) => formatCurrency(row.original.custoUnitario || 0),
    },
    {
        accessorKey: 'precoVenda',
        header: 'Preço de Venda',
        cell: ({ row }) => {
            const produto = row.original;
            return produto.tipoProduto === 'VENDA' ? formatCurrency(produto.precoVenda) : '-';
        },
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
        const produto = row.original;
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
              {produto.status === 'ativo' ? (
                <>
                  <DropdownMenuItem onClick={() => onEdit(produto)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSetStatus(produto.id!, 'inativo')} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Inativar
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => onSetStatus(produto.id!, 'ativo')} className="text-green-600">
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

  const renderSubComponent = ({ row }: { row: any }) => {
    const p = row.original;
    return (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 text-sm space-y-1">
            <p><strong>ID:</strong> {p.id}</p>
            {p.tipoProduto === 'VENDA' && (
                <>
                    <p><strong>NCM:</strong> {p.ncm}</p>
                    <p><strong>CFOP:</strong> {p.cfop}</p>
                    <p><strong>SKU:</strong> {p.sku || '-'}</p>
                </>
            )}
            {p.tipoProduto === 'USO_INTERNO' && <p><strong>Categoria:</strong> {p.categoriaNome || 'Não informada'}</p>}
        </div>
    );
  };

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
