"use client";

import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";

interface UnidadesActionsProps {
  onNew: () => void;
}

export function UnidadesActions({ onNew }: UnidadesActionsProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <h1 className="text-2xl font-bold tracking-tight shrink-0">
        Unidades de Medida
      </h1>
      <Button onClick={onNew} className="w-full sm:w-auto">
        <IconPlus className="mr-2 h-4 w-4" />
        Adicionar Unidade
      </Button>
    </div>
  );
}
