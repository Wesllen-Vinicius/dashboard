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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Gerenciamento de Compras</h1>
      <div className="flex items-center gap-2">
        <DateRangePicker date={dateRange} onDateChange={onDateChange} />
        <Button onClick={onNewCompra}>
          <IconPlus className="mr-2 h-4 w-4" />
          Registrar Compra
        </Button>
      </div>
    </div>
  );
}
