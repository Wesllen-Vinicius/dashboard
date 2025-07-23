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
import { ContaBancaria } from "@/lib/schemas";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils/formatters";

interface ContasBancariasTableProps {
  contas: ContaBancaria[];
  isLoading: boolean;
  onEdit: (conta: ContaBancaria) => void;
  onToggle: (id: string) => void;
}

export function ContasBancariasTable({
  contas,
  isLoading,
  onEdit,
  onToggle,
}: ContasBancariasTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "nomeConta", desc: false },
  ]);

  const columns: ColumnDef<ContaBancaria>[] = [
    {
      accessorKey: "nomeConta",
      header: "Nome da Conta",
      cell: ({ row }) => <span className="font-medium">{row.original.nomeConta}</span>,
    },
    {
      accessorKey: "banco",
      header: "Banco",
    },
    {
      accessorKey: "tipo",
      header: "Tipo",
    },
    {
      accessorKey: "saldoAtual",
      header: () => <div className="text-right">Saldo Atual</div>,
      cell: ({ row }) => <div className="text-right">{formatCurrency(row.original.saldoAtual)}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const { status } = row.original;
        return <Badge variant={status === "ativa" ? "default" : "secondary"}>{status}</Badge>;
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Ações</div>,
      cell: ({ row }) => {
        const conta = row.original;
        const isActive = conta.status === "ativa";
        return (
          <div className="text-right space-x-2">
            <Button variant="outline" size="icon" onClick={() => onEdit(conta)}>
              <IconPencil className="h-4 w-4" />
            </Button>
            <Button variant={isActive ? "destructive" : "default"} size="icon" onClick={() => onToggle(conta.id!)} className={!isActive ? "bg-green-600 hover:bg-green-700" : ""}>
              {isActive ? <IconLock className="h-4 w-4" /> : <IconLockOpen className="h-4 w-4" />}
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: contas,
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
            <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">Nenhuma conta encontrada.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
