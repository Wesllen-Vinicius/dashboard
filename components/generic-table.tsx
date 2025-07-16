"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  ExpandedState,
  getExpandedRowModel,
  Row,
  OnChangeFn,
} from "@tanstack/react-table";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "./ui/input";

interface GenericTableProps<TData extends object> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  filterPlaceholder?: string;
  filterColumnId?: keyof TData;
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactElement;
  expanded?: ExpandedState;
  onExpandedChange?: OnChangeFn<ExpandedState>;
}

export function GenericTable<TData extends object>({
  columns,
  data,
  filterPlaceholder,
  filterColumnId,
  renderSubComponent,
  expanded,
  onExpandedChange,
}: GenericTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = React.useState('');

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, expanded },
    onExpandedChange,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => !!renderSubComponent,
  });

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
            placeholder={filterPlaceholder || "Filtrar..."}
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(String(event.target.value))}
            className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                    <TableRow data-state={row.getIsSelected() && "selected"}>
                        {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                        ))}
                    </TableRow>
                    {row.getIsExpanded() && renderSubComponent && (
                        <TableRow>
                            <TableCell colSpan={columns.length + 1} className="p-0">
                                {renderSubComponent({ row })}
                            </TableCell>
                        </TableRow>
                    )}
                </React.Fragment>
              ))
            ) : (
              <TableRow><TableCell colSpan={columns.length + 1} className="h-24 text-center">Nenhum resultado.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
       <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Anterior</Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Próximo</Button>
      </div>
    </div>
  );
}
