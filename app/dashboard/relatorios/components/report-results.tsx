"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GenericTable } from "@/components/generic-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconFileTypePdf, IconFileTypeXls } from "@tabler/icons-react";
import { Skeleton } from "@/components/ui/skeleton";

// Adicionada a restrição "extends object" para o tipo genérico TData
interface ReportResultsProps<TData extends object> {
  reportKey: string;
  reportLabel: string;
  data: TData[];
  columns: ColumnDef<TData>[];
  isLoading: boolean;
  onExport: (type: 'pdf' | 'csv') => void;
  renderSubComponent?: (props: { row: any }) => React.ReactElement;
  summaryComponent?: React.ReactNode;
}

export function ReportResults<TData extends object>({
  reportKey,
  reportLabel,
  data,
  columns,
  isLoading,
  onExport,
  renderSubComponent,
  summaryComponent,
}: ReportResultsProps<TData>) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(item =>
    JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Resultados: {reportLabel}</CardTitle>
          <CardDescription>
            {isLoading ? "Carregando dados..." : `Foram encontrados ${filteredData.length} registros.`}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onExport('pdf')} variant="outline" size="sm" disabled={isLoading || data.length === 0}>
            <IconFileTypePdf className="mr-2 h-4 w-4" />PDF
          </Button>
          <Button onClick={() => onExport('csv')} variant="outline" size="sm" disabled={isLoading || data.length === 0}>
            <IconFileTypeXls className="mr-2 h-4 w-4" />CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2 mt-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            {summaryComponent}
            <Input
              placeholder="Filtrar resultados na tabela atual..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm mb-4"
            />
            <GenericTable<TData>
              columns={columns}
              data={filteredData}
              renderSubComponent={renderSubComponent}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
