'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PlusCircle } from 'lucide-react';

interface ProducaoActionsProps {
  onAdd: () => void;
  onSearch: (term: string) => void;
  showInactive: boolean;
  onShowInactiveChange: (checked: boolean) => void;
}

export function ProducaoActions({
  onAdd,
  onSearch,
  showInactive,
  onShowInactiveChange,
}: ProducaoActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight whitespace-nowrap">
        Gestão de Produção
      </h1>
      <div className="flex w-full sm:w-auto flex-col sm:flex-row items-center gap-2">
        <Input
          placeholder="Filtrar por lote..."
          onChange={(e) => onSearch(e.target.value)}
          className="w-full sm:w-auto"
        />
        <div className="flex items-center space-x-2">
          <Switch
            id="show-inactive"
            checked={showInactive}
            onCheckedChange={onShowInactiveChange}
          />
          <Label htmlFor="show-inactive">Mostrar inativos</Label>
        </div>
        <Button onClick={onAdd} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Produção
        </Button>
      </div>
    </div>
  );
}
