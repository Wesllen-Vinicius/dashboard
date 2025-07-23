"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
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
  IconUserCheck,
  IconUserOff,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Categoria } from "@/lib/schemas";
import { useState } from "react";

interface CategoriasTableProps {
  categorias: Categoria[];
  isLoading: boolean;
  onEdit: (categoria: Categoria) => void;
  onToggle: (id: string) => void;
}

export function CategoriasTable({
  categorias,
  isLoading,
  onEdit,
  onToggle,
}: CategoriasTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<Categoria>[] = [
    {
      accessorKey: "nome",
      header: "Nome da Categoria",
      cell: ({ row }) => <span className="font-medium">{row.original.nome}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const { status } = row.original;
        return <Badge variant={status === "ativo" ? "default" : "destructive"}>{status}</Badge>;
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Ações</div>,
      cell: ({ row }) => {
        const categoria = row.original;
        const isActive = categoria.status === "ativo";
        return (
          <div className="text-right space-x-2">
            <Button variant="outline" size="icon" onClick={() => onEdit(categoria)}>
              <IconPencil className="h-4 w-4" />
            </Button>
            <Button variant={isActive ? "destructive" : "default"} size="icon" onClick={() => onToggle(categoria.id!)} className={!isActive ? "bg-green-600 hover:bg-green-700" : ""}>
              {isActive ? <IconUserOff className="h-4 w-4" /> : <IconUserCheck className="h-4 w-4" />}
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: categorias,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
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
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">Carregando...</TableCell></TableRow>
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}
                </TableRow>
            ))
          ) : (
            <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">Nenhuma categoria encontrada.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
