"use client";

import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/date-range-picker";
import { IconPlus } from "@tabler/icons-react";
import { DateRange } from "react-day-picker";

interface AbateActionsProps {
  dateRange: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  onNewAbate: () => void;
}

export function AbateActions({ dateRange, onDateChange, onNewAbate }: AbateActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Gerenciamento de Abates</h1>
      <div className="flex items-center gap-2">
        <DateRangePicker date={dateRange} onDateChange={onDateChange} />
        <Button onClick={onNewAbate}>
          <IconPlus className="mr-2 h-4 w-4" />
          Registrar Abate
        </Button>
      </div>
    </div>
  );
}
