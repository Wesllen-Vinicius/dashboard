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
import { IconPencil, IconTrash } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Unidade } from "@/lib/schemas";
import { useState } from "react";

interface UnidadesTableProps {
  unidades: Unidade[];
  isLoading: boolean;
  onEdit: (unidade: Unidade) => void;
  onDelete: (id: string) => void;
}

export function UnidadesTable({
  unidades,
  isLoading,
  onEdit,
  onDelete,
}: UnidadesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<Unidade>[] = [
    {
      accessorKey: "nome",
      header: "Nome da Unidade",
      cell: ({ row }) => <span className="font-medium">{row.original.nome}</span>,
    },
    {
      accessorKey: "sigla",
      header: "Sigla",
    },
    {
      id: "actions",
      header: () => <div className="text-right">Ações</div>,
      cell: ({ row }) => {
        const unidade = row.original;
        return (
          <div className="text-right space-x-2">
            <Button variant="outline" size="icon" onClick={() => onEdit(unidade)}>
              <IconPencil className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="icon" onClick={() => onDelete(unidade.id!)}>
              <IconTrash className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: unidades,
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
            <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">Nenhuma unidade encontrada.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
