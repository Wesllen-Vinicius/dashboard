"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  ExpandedState,
  OnChangeFn,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  IconPencil,
  IconLock,
  IconLockOpen,
  IconChevronDown,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Produto } from "@/lib/schemas";
import { useState, Fragment } from "react";
import { formatCurrency } from "@/lib/utils/formatters";
import { ProdutoDetails } from "./produto-details";

interface ProdutosTableProps {
  produtos: Produto[];
  isLoading: boolean;
  onEdit: (produto: Produto) => void;
  onToggle: (id: string) => void;
  expanded: ExpandedState;
  onExpandedChange: OnChangeFn<ExpandedState>;
}

export function ProdutosTable({
  produtos,
  isLoading,
  onEdit,
  onToggle,
  expanded,
  onExpandedChange,
}: ProdutosTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<Produto>[] = [
    {
      id: 'expander',
      header: () => null,
      cell: ({ row }) => (
        <Button size="icon" variant="ghost" onClick={row.getToggleExpandedHandler()} disabled={!row.getCanExpand()}>
          <IconChevronDown className={`h-4 w-4 transition-transform ${row.getIsExpanded() ? 'rotate-180' : ''}`} />
        </Button>
      ),
    },
    {
      accessorKey: "nome",
      header: "Nome do Produto",
      cell: ({ row }) => <span className="font-medium">{row.original.nome}</span>,
    },
    {
      accessorKey: "tipoProduto",
      header: "Tipo",
      cell: ({ row }) => {
        const tipo = row.original.tipoProduto;
        const variant: "default" | "secondary" | "outline" = tipo === 'VENDA' ? 'default' : tipo === 'MATERIA_PRIMA' ? 'secondary' : 'outline';
        return <Badge variant={variant}>{tipo.replace('_', ' ')}</Badge>
      }
    },
     {
      accessorKey: "quantidade",
      header: "Estoque",
    },
    {
      accessorKey: "custoUnitario",
      header: "Custo",
       cell: ({ row }) => formatCurrency(row.original.custoUnitario)
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant={row.original.status === "ativo" ? "default" : "destructive"}>{row.original.status}</Badge>,
    },
    {
      id: "actions",
      header: () => <div className="text-right">Ações</div>,
      cell: ({ row }) => {
        const produto = row.original;
        const isActive = produto.status === "ativo";
        return (
          <div className="text-right space-x-2">
            <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(produto); }}>
              <IconPencil className="h-4 w-4" />
            </Button>
            <Button variant={isActive ? "destructive" : "default"} size="icon" onClick={(e) => { e.stopPropagation(); onToggle(produto.id!); }} className={!isActive ? "bg-green-600 hover:bg-green-700" : ""}>
              {isActive ? <IconLock className="h-4 w-4" /> : <IconLockOpen className="h-4 w-4" />}
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: produtos,
    columns,
    state: { sorting, expanded },
    onSortingChange: setSorting,
    onExpandedChange: onExpandedChange,
    getRowCanExpand: () => true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => <TableHead key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">Carregando...</TableCell></TableRow>
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                <TableRow data-state={row.getIsSelected() && "selected"} onClick={row.getToggleExpandedHandler()} className="cursor-pointer">
                  {row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}
                </TableRow>
                {row.getIsExpanded() && (
                  <TableRow><TableCell colSpan={columns.length}><ProdutoDetails produto={row.original} /></TableCell></TableRow>
                )}
              </Fragment>
            ))
          ) : (
            <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">Nenhum produto encontrado.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
