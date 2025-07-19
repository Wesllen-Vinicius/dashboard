"use client";

import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface FornecedoresActionsProps {
  onNew: () => void;
  showInactive: boolean;
  onShowInactiveChange: (checked: boolean) => void;
}

export default function FornecedoresActions({
  onNew,
  showInactive,
  onShowInactiveChange,
}: FornecedoresActionsProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <h1 className="text-2xl font-bold tracking-tight shrink-0">
        Gerenciamento de Fornecedores
      </h1>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto sm:justify-end">
        <div className="flex items-center justify-between sm:justify-start space-x-2 p-2 border rounded-lg">
          <Label htmlFor="show-inactive" className="text-sm">
            Mostrar inativos
          </Label>
          <Switch
            id="show-inactive"
            checked={showInactive}
            onCheckedChange={onShowInactiveChange}
          />
        </div>
        <Button onClick={onNew} className="w-full sm:w-auto">
          <IconPlus className="mr-2 h-4 w-4" />
          Adicionar Fornecedor
        </Button>
      </div>
    </div>
  );
}
