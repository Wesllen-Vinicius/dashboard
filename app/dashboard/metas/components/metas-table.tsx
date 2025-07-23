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
  IconLock,
  IconLockOpen,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Meta } from "@/lib/schemas";
import { useState } from "react";

interface MetasTableProps {
  metas: Meta[];
  isLoading: boolean;
  onEdit: (meta: Meta) => void;
  onToggle: (id: string) => void;
}

export function MetasTable({
  metas,
  isLoading,
  onEdit,
  onToggle,
}: MetasTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<Meta>[] = [
    {
      accessorKey: "produtoNome",
      header: "Produto",
      cell: ({ row }) => <span className="font-medium">{row.original.produtoNome}</span>,
    },
    {
      accessorKey: "metaPorAnimal",
      header: "Meta por Animal",
      cell: ({ row }) => `${row.original.metaPorAnimal} ${row.original.unidade || ''}`
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const { status } = row.original;
        return <Badge variant={status === "ativo" ? "default" : "secondary"}>{status}</Badge>;
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Ações</div>,
      cell: ({ row }) => {
        const meta = row.original;
        const isActive = meta.status === "ativo";
        return (
          <div className="text-right space-x-2">
            <Button variant="outline" size="icon" onClick={() => onEdit(meta)}>
              <IconPencil className="h-4 w-4" />
            </Button>
            <Button variant={isActive ? "destructive" : "default"} size="icon" onClick={() => onToggle(meta.id!)} className={!isActive ? "bg-green-600 hover:bg-green-700" : ""}>
              {isActive ? <IconLock className="h-4 w-4" /> : <IconLockOpen className="h-4 w-4" />}
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: metas,
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
            <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">Nenhuma meta encontrada.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
