"use client";

import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";

interface CategoriasActionsProps {
  onNew: () => void;
}

export function CategoriasActions({ onNew }: CategoriasActionsProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <h1 className="text-2xl font-bold tracking-tight shrink-0">
        Categorias de Produtos
      </h1>
      <Button onClick={onNew} className="w-full sm:w-auto">
        <IconPlus className="mr-2 h-4 w-4" />
        Adicionar Categoria
      </Button>
    </div>
  );
}
