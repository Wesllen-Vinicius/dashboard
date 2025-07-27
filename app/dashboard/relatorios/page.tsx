"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";

import { ReportFilters } from "./components/report-filters";
import { ReportResults } from "./components/report-results";
import { ProductionReportSummary, renderSubComponentCompras, renderSubComponentProducao, renderSubComponentVendas } from "./components/report-specific-components";
import { getReportColumns, getReportFetchers } from "./components/report-definitions";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useDataStore } from "@/store/data.store";
import {
    Movimentacao, Venda, Producao, Cliente, Fornecedor, Produto, Funcionario, Compra, ContaAReceber, DespesaOperacional
} from "@/lib/schemas";
import { allReportLabels, ReportKey } from "./types";

type EnrichedVenda = Venda & { clienteNome?: string };
type EnrichedProducao = Producao & { responsavelNome?: string; };
type EnrichedCompra = Compra & { fornecedorNome?: string };
type EnrichedFuncionario = Funcionario & { cargoNome?: string };
type EnrichedContaAReceber = ContaAReceber & { clienteNome?: string };
type ReportData = EnrichedVenda | EnrichedCompra | EnrichedProducao | Movimentacao | Cliente | Fornecedor | Produto | EnrichedFuncionario | any | EnrichedContaAReceber | DespesaOperacional;
type ExportType = 'pdf' | 'csv';

export default function RelatoriosPage() {
    const [date, setDate] = useState<DateRange | undefined>();
    const [selectedCategory, setSelectedCategory] = useState<any>("operacional");
    const [reportType, setReportType] = useState<ReportKey>('vendas');
    const [reportData, setReportData] = useState<ReportData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [exportType, setExportType] = useState<ExportType | null>(null);
    const [selectedColumns, setSelectedColumns] = useState<Record<string, boolean>>({});
    const dataStore = useDataStore();

    const handleGenerateReport = useCallback(async (type: ReportKey, period: DateRange) => {
        if (!period?.from || !period?.to) {
            return toast.error("Por favor, selecione um período de início e fim.");
        }
        setIsLoading(true);
        setReportData([]);
        try {
            const reportFetchers = getReportFetchers();
            const data = await reportFetchers[type](period.from, period.to);
            setReportData(data);
            if (data.length === 0) toast.info("Nenhum dado encontrado para os filtros selecionados.");
        } catch (e: any) {
            toast.error("Erro ao gerar o relatório.", { description: e.message });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const savedFilters = localStorage.getItem('reportFilters');
        if (savedFilters) {
            const { date: savedDate, category, type } = JSON.parse(savedFilters);
            if (savedDate?.from && savedDate?.to) setDate({ from: new Date(savedDate.from), to: new Date(savedDate.to) });
            if (category) setSelectedCategory(category);
            if (type) setReportType(type);
        }
    }, []);

    useEffect(() => {
        if (date?.from && date?.to) {
            handleGenerateReport(reportType, date);
            localStorage.setItem('reportFilters', JSON.stringify({ date, category: selectedCategory, type: reportType }));
        }
    }, [date, reportType, selectedCategory, handleGenerateReport]);

    const handleClearFilters = () => {
        setDate(undefined);
        setSelectedCategory('operacional');
        setReportType('vendas');
        setReportData([]);
        localStorage.removeItem('reportFilters');
    };

    const enrichedData = useMemo((): ReportData[] => {
        if (!reportData.length) return [];
        switch (reportType) {
            case 'vendas': return (reportData as Venda[]).map(v => ({ ...v, clienteNome: dataStore.clientes.find(c => c.id === v.clienteId)?.nomeRazaoSocial || 'N/A' }));
            case 'producao': return (reportData as Producao[]).map(p => ({ ...p, responsavelNome: dataStore.funcionarios.find(f => f.id === p.responsavelId)?.nomeCompleto || 'N/A' }));
            case 'compras': return (reportData as Compra[]).map(c => ({ ...c, fornecedorNome: dataStore.fornecedores.find(f => f.id === c.fornecedorId)?.nomeRazaoSocial || 'N/A' }));
            case 'funcionarios': return (reportData as Funcionario[]).map(f => ({ ...f, cargoNome: dataStore.cargos.find(c => c.id === f.cargoId)?.nome || 'N/A' }));
            case 'contasAPagar': return reportData.map(c => ({ ...c, fornecedorNome: dataStore.fornecedores.find(f => f.id === c.fornecedorId)?.nomeRazaoSocial || 'N/A' }));
            case 'contasAReceber': return (reportData as ContaAReceber[]).map(conta => ({ ...conta, clienteNome: dataStore.clientes.find(c => c.id === conta.clienteId)?.nomeRazaoSocial || 'N/A' }));
            default: return reportData;
        }
    }, [reportData, reportType, dataStore]);

    const availableColumns = useMemo(() => getReportColumns(reportType), [reportType]);

    const openExportDialog = (type: ExportType) => {
        if (!enrichedData.length) return toast.error("Não há dados para exportar.");
        const initialSelection: Record<string, boolean> = {};
        availableColumns.forEach((col: ColumnDef<ReportData>) => { if (col.id) initialSelection[col.id] = true; });
        setSelectedColumns(initialSelection);
        setExportType(type);
        setIsExportDialogOpen(true);
    };

    const handleConfirmExport = () => {
        const columnsToExport = availableColumns.filter(col => col.id && selectedColumns[col.id]);
        if (columnsToExport.length === 0) return toast.error("Selecione pelo menos uma coluna para exportar.");

        const headers = columnsToExport.map(col => String(col.header));

        const data = enrichedData.map(row => columnsToExport.map(col => {
            let cellValue: any;
            // Safely check for accessorKey and cell function
            const accessorKey = 'accessorKey' in col ? col.accessorKey as string : undefined;

            if (typeof col.cell === 'function') {
                cellValue = col.cell({ row } as any);
            } else if (accessorKey) {
                cellValue = (row as any)[accessorKey];
            }

            if (React.isValidElement(cellValue)) {
                const props = cellValue.props as { children?: React.ReactNode };
                return String(props.children ?? '');
            }
            return String(cellValue ?? '');
        }));

        if (exportType === 'pdf') {
            const doc = new jsPDF();
            autoTable(doc, { head: [headers], body: data });
            doc.save(`relatorio_${reportType}.pdf`);
        } else {
            const csvContent = [headers.join(','), ...data.map(row => row.join(','))].join('\n');
            const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
            saveAs(blob, `relatorio_${reportType}.csv`);
        }
        setIsExportDialogOpen(false);
    };

    const renderSubComponent = useMemo(() => {
        switch (reportType) {
            case 'producao': return renderSubComponentProducao;
            case 'vendas': return renderSubComponentVendas;
            case 'compras': return renderSubComponentCompras;
            default: return undefined;
        }
    }, [reportType]);

    const summaryComponent = useMemo(() => {
        if (reportType !== 'producao' || !enrichedData.length) return null;
        const summary = (enrichedData as EnrichedProducao[]).reduce((acc, p) => {
            p.produtos.forEach(item => {
                acc.totalProduzido += item.quantidade;
                acc.totalPerdas += item.perda || 0;
            });
            return acc;
        }, { totalProduzido: 0, totalPerdas: 0 });
        const totalBruto = summary.totalProduzido + summary.totalPerdas;
        const rendimento = totalBruto > 0 ? (summary.totalProduzido / totalBruto) * 100 : 0;
        return <ProductionReportSummary summary={{ ...summary, totalBruto, rendimento }} />;
    }, [enrichedData, reportType]);

    return (
        <div className="container mx-auto py-8 px-4 md:px-6 space-y-6">
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Selecionar Colunas para Exportação</DialogTitle></DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        {availableColumns.map((col: ColumnDef<ReportData>) => (
                            <div key={String(col.id)} className="flex items-center space-x-2">
                                <Checkbox id={String(col.id)} checked={!!selectedColumns[String(col.id)]} onCheckedChange={(checked) => setSelectedColumns(p => ({ ...p, [String(col.id)]: !!checked }))} />
                                <Label htmlFor={String(col.id)}>{String(col.header)}</Label>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                        <Button type="button" onClick={handleConfirmExport}>Confirmar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ReportFilters
                date={date}
                onDateChange={setDate}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                reportType={reportType}
                onReportTypeChange={setReportType}
                onClearFilters={handleClearFilters}
                isLoading={isLoading}
            />

            {(reportData.length > 0 || isLoading) && (
                <ReportResults
                    reportKey={reportType}
                    reportLabel={allReportLabels[reportType]}
                    data={enrichedData}
                    columns={availableColumns}
                    isLoading={isLoading}
                    onExport={openExportDialog}
                    renderSubComponent={renderSubComponent as any}
                    summaryComponent={summaryComponent}
                />
            )}
        </div>
    );
}
