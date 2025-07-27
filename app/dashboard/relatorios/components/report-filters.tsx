"use client";

import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IconX } from "@tabler/icons-react";

const reportGroups = {
  operacional: {
    label: "Operacional",
    reports: { vendas: "Vendas", compras: "Compras", producao: "Produção", movimentacoes: "Estoque" },
  },
  cadastros: {
    label: "Cadastros",
    reports: { clientes: "Clientes", fornecedores: "Fornecedores", produtos: "Produtos", funcionarios: "Funcionários" },
  },
  financeiro: {
    label: "Financeiro",
    reports: { contasAPagar: "Contas a Pagar", contasAReceber: "Contas a Receber", despesas: "Despesas Operacionais" },
  },
};

type ReportKey = keyof typeof reportGroups.operacional.reports | keyof typeof reportGroups.cadastros.reports | keyof typeof reportGroups.financeiro.reports;
type ReportCategory = keyof typeof reportGroups;

interface ReportFiltersProps {
  date?: DateRange;
  onDateChange: (date?: DateRange) => void;
  selectedCategory: ReportCategory;
  onCategoryChange: (category: ReportCategory) => void;
  reportType: ReportKey;
  onReportTypeChange: (type: ReportKey) => void;
  onClearFilters: () => void;
  isLoading: boolean;
}

export function ReportFilters({
  date,
  onDateChange,
  selectedCategory,
  onCategoryChange,
  reportType,
  onReportTypeChange,
  onClearFilters,
  isLoading,
}: ReportFiltersProps) {

  const handleCategoryChange = (value: string) => {
    const newCategory = value as ReportCategory;
    onCategoryChange(newCategory);
    // Ao mudar a categoria, seleciona o primeiro relatório da nova lista
    const firstReportInNewCategory = Object.keys(reportGroups[newCategory].reports)[0] as ReportKey;
    onReportTypeChange(firstReportInNewCategory);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerador de Relatórios</CardTitle>
        <CardDescription>Selecione o tipo de relatório e o período desejado para começar.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto] items-end gap-4">
          <div className="grid gap-2">
            <Label htmlFor="category-select">Categoria do Relatório</Label>
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger id="category-select" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(reportGroups).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="report-select">Relatório Específico</Label>
            <Select value={reportType} onValueChange={(value) => onReportTypeChange(value as ReportKey)}>
              <SelectTrigger id="report-select" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(reportGroups[selectedCategory].reports).map(([key, label]) => (
                  <SelectItem key={key} value={key as ReportKey}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Período</Label>
            <DateRangePicker date={date} onDateChange={onDateChange} />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onClearFilters} variant="ghost" size="icon" title="Limpar Filtros">
              <IconX className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
