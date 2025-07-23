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
import { Funcionario } from "@/lib/schemas";
import { useState, Fragment } from "react"; // Importar Fragment
import { FuncionarioDetails } from "./funcionario-details";

interface FuncionariosTableProps {
  funcionarios: Funcionario[];
  isLoading: boolean;
  onEdit: (funcionario: Funcionario) => void;
  onDelete: (id: string) => void;
  onReactivate: (id: string) => void;
  expanded: ExpandedState;
  onExpandedChange: OnChangeFn<ExpandedState>;
}

export function FuncionariosTable({
  funcionarios,
  isLoading,
  onEdit,
  onDelete,
  onReactivate,
  expanded,
  onExpandedChange,
}: FuncionariosTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<Funcionario>[] = [
     {
      id: 'expander',
      header: () => null,
      cell: ({ row }) => (
        <Button
          size="icon"
          variant="ghost"
          onClick={row.getToggleExpandedHandler()}
          disabled={!row.getCanExpand()}
        >
          <IconChevronDown
            className={`h-4 w-4 transition-transform ${
              row.getIsExpanded() ? 'rotate-180' : ''
            }`}
          />
        </Button>
      ),
    },
    {
      accessorKey: "nomeCompleto",
      header: "Nome Completo",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.nomeCompleto}</span>
      ),
    },
    {
      accessorKey: "cargoNome",
      header: "Cargo",
    },
    {
      accessorKey: "contato",
      header: "Contato",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const { status } = row.original;
        return (
          <Badge variant={status === "ativo" ? "default" : "destructive"}>
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Ações</div>,
      cell: ({ row }) => {
        const funcionario = row.original;
        const isActive = funcionario.status === "ativo";
        return (
          <div className="text-right space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={(e) => { e.stopPropagation(); onEdit(funcionario); }}
            >
              <IconPencil className="h-4 w-4" />
            </Button>
            {isActive ? (
              <Button
                variant="destructive"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onDelete(funcionario.id!); }}
              >
                <IconUserOff className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="default"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onReactivate(funcionario.id!); }}
                className="bg-green-600 hover:bg-green-700"
              >
                <IconUserCheck className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: funcionarios,
    columns,
    state: {
      sorting,
      expanded,
    },
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
                <TableHead key={header.id} style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Carregando...
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                <TableRow
                  data-state={row.getIsSelected() && "selected"}
                  onClick={row.getToggleExpandedHandler()}
                  className="cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
                {row.getIsExpanded() && (
                  <TableRow>
                    <TableCell colSpan={columns.length}>
                      <FuncionarioDetails funcionario={row.original} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Nenhum funcionário encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
