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
  IconUserCheck,
  IconUserOff,
  IconChevronDown,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SystemUser } from "@/lib/schemas";
import { useState, Fragment } from "react"; // Importar Fragment
import { UsuarioDetails } from "./usuario-details";

interface UsuariosTableProps {
  users: SystemUser[];
  isLoading: boolean;
  onEdit: (user: SystemUser) => void;
  onToggle: (id: string) => void;
  expanded: ExpandedState;
  onExpandedChange: OnChangeFn<ExpandedState>;
}

export function UsuariosTable({
  users,
  isLoading,
  onEdit,
  onToggle,
  expanded,
  onExpandedChange,
}: UsuariosTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<SystemUser>[] = [
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
      accessorKey: "displayName",
      header: "Nome de Exibição",
      cell: ({ row }) => <span className="font-medium">{row.original.displayName}</span>,
    },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "role", header: "Função" },
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
        const user = row.original;
        const isActive = user.status === "ativo";
        return (
          <div className="text-right space-x-2">
            <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(user); }}>
              <IconPencil className="h-4 w-4" />
            </Button>
            <Button variant={isActive ? "destructive" : "default"} size="icon" onClick={(e) => { e.stopPropagation(); onToggle(user.uid); }} className={!isActive ? "bg-green-600 hover:bg-green-700" : ""}>
              {isActive ? <IconUserOff className="h-4 w-4" /> : <IconUserCheck className="h-4 w-4" />}
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: users,
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
              // CORREÇÃO: Adiciona a 'key' ao Fragment, o elemento pai do loop
              <Fragment key={row.id}>
                <TableRow data-state={row.getIsSelected() && "selected"} onClick={row.getToggleExpandedHandler()} className="cursor-pointer">
                  {row.getVisibleCells().map((cell) => (<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}
                </TableRow>
                {row.getIsExpanded() && (
                  <TableRow>
                    <TableCell colSpan={columns.length}>
                      <UsuarioDetails user={row.original} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))
          ) : (
            <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">Nenhum usuário encontrado.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
