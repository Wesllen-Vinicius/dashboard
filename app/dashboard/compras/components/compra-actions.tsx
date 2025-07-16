"use client";

import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/date-range-picker";
import { IconPlus } from "@tabler/icons-react";
import { DateRange } from "react-day-picker";

interface CompraActionsProps {
  dateRange: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  onNewCompra: () => void;
}

export function CompraActions({ dateRange, onDateChange, onNewCompra }: CompraActionsProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <h1 className="text-2xl font-bold tracking-tight shrink-0">
        Gerenciamento de Compras
      </h1>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto sm:justify-end">
        <DateRangePicker date={dateRange} onDateChange={onDateChange} />
        <Button onClick={onNewCompra} className="w-full sm:w-auto">
          <IconPlus className="mr-2 h-4 w-4" />
          Registrar Compra
        </Button>
      </div>
    </div>
  );
}
