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
import { Cargo } from "@/lib/schemas";
import { useState } from "react";

interface CargosTableProps {
  cargos: Cargo[];
  isLoading: boolean;
  onEdit: (cargo: Cargo) => void;
  onToggle: (id: string) => void;
}

export function CargosTable({
  cargos,
  isLoading,
  onEdit,
  onToggle,
}: CargosTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<Cargo>[] = [
    {
      accessorKey: "nome",
      header: "Nome do Cargo",
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
        const cargo = row.original;
        const isActive = cargo.status === "ativo";
        return (
          <div className="text-right space-x-2">
            <Button variant="outline" size="icon" onClick={() => onEdit(cargo)}>
              <IconPencil className="h-4 w-4" />
            </Button>
            <Button variant={isActive ? "destructive" : "default"} size="icon" onClick={() => onToggle(cargo.id!)} className={!isActive ? "bg-green-600 hover:bg-green-700" : ""}>
              {isActive ? <IconUserOff className="h-4 w-4" /> : <IconUserCheck className="h-4 w-4" />}
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: cargos,
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
            <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">Nenhum cargo encontrado.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
