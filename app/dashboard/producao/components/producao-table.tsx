'use client';

import { ColumnDef, ExpandedState, OnChangeFn } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { GenericTable } from '@/components/generic-table';
import { Producao, Funcionario, Abate, Compra } from '@/lib/schemas';
import { IconChevronDown } from '@tabler/icons-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ProducaoTableProps {
  data: Producao[];
  funcionarios: Funcionario[];
  abates: Abate[];
  compras: Compra[];
  onEdit: (producao: Producao) => void;
  onSetStatus: (id: string, status: 'ativo' | 'inativo') => void;
  expanded: ExpandedState;
  onExpandedChange: OnChangeFn<ExpandedState>;
}

const getResponsavelNome = (id: string, funcionarios: Funcionario[]) => {
    return funcionarios.find(f => f.id === id)?.nomeCompleto || 'N/A';
};

const getAbateRef = (id: string, abates: Abate[], compras: Compra[]) => {
    const abate = abates.find(a => a.id === id);
    if (!abate) return 'N/A';
    const compra = compras.find(c => c.id === abate.compraId);
    return `Abate de ${format(new Date(abate.data), "dd/MM/yy")} (NF ${compra?.notaFiscal || '?'})`;
};


export function ProducaoTable({ data, funcionarios, abates, compras, onEdit, onSetStatus, expanded, onExpandedChange }: ProducaoTableProps) {
  const columns: ColumnDef<Producao>[] = [
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
                    <TooltipContent side="right"><p>{isExpanded ? "Ocultar Produtos" : "Ver Produtos"}</p></TooltipContent>
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
    {
      accessorKey: 'lote',
      header: 'Lote',
      cell: ({row}) => row.original.lote || '-'
    },
    {
      accessorKey: 'responsavelId',
      header: 'Responsável',
      cell: ({ row }) => getResponsavelNome(row.original.responsavelId, funcionarios),
    },
    {
      accessorKey: 'abateId',
      header: 'Abate de Origem',
      cell: ({ row }) => getAbateRef(row.original.abateId, abates, compras),
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
        const producao = row.original;
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
              {producao.status === 'ativo' ? (
                <>
                  <DropdownMenuItem onClick={() => onEdit(producao)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSetStatus(producao.id!, 'inativo')} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Inativar
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => onSetStatus(producao.id!, 'ativo')} className="text-green-600">
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
      <h4 className="font-semibold mb-2 text-sm">Itens Produzidos:</h4>
      <ul className="list-disc pl-5 text-sm">
        {row.original.produtos.map((item: any, index: number) => (
          <li key={index}>
            <strong>{item.produtoNome}:</strong> {item.quantidade} un. (Perda: {item.perda} un.)
          </li>
        ))}
      </ul>
       <p className='text-xs text-muted-foreground mt-2'><strong>Registrado por:</strong> {row.original.registradoPor.nome}</p>
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
