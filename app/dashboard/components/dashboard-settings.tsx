"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// Tipagem para a configuração de um único widget
type WidgetConfig = {
  name: string;
  visible: boolean;
  layout: string;
};

// Tipagem para o objeto completo de configurações
type AllWidgetsConfig = {
  [key: string]: WidgetConfig;
};

interface DashboardSettingsProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  widgetConfig: AllWidgetsConfig;
  onConfigChange: (newConfig: AllWidgetsConfig) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function DashboardSettings({ isOpen, onOpenChange, widgetConfig, onConfigChange, onSave, isSaving }: DashboardSettingsProps) {

  const handleToggle = (widgetId: string, checked: boolean) => {
    const newConfig = {
      ...widgetConfig,
      [widgetId]: { ...widgetConfig[widgetId], visible: checked },
    };
    onConfigChange(newConfig);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Personalizar Dashboard</SheetTitle>
          <SheetDescription>
            Ative ou desative os widgets que você deseja ver no seu painel.
          </SheetDescription>
        </SheetHeader>
        <div className="py-6 space-y-4">
          <h4 className="font-semibold text-foreground">Widgets Disponíveis</h4>
          {Object.entries(widgetConfig).map(([id, { name, visible }]) => (
            <div key={id} className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor={`widget-toggle-${id}`} className="text-sm font-medium">
                {name}
              </Label>
              <Switch
                id={`widget-toggle-${id}`}
                checked={visible}
                onCheckedChange={(checked) => handleToggle(id, checked)}
              />
            </div>
          ))}
        </div>
        <SheetFooter>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
