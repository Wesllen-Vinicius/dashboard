"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface VendasActionsProps {
  onAdd: () => void;
  onSearch: (term: string) => void;
}

export function VendasActions({ onAdd, onSearch }: VendasActionsProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Input
        placeholder="Pesquisar por cliente..."
        className="max-w-sm"
        onChange={(e) => onSearch(e.target.value)}
      />
      <Button onClick={onAdd}>Nova Venda</Button>
    </div>
  );
}
