"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { IconPencil, IconFileInvoice, IconLoader, IconFileDownload, IconFileX, IconAlertTriangle } from "@tabler/icons-react";
import { GenericTable } from "@/components/generic-table";
import { Venda } from "@/lib/schemas";

type VendaComDetalhes = Venda & { clienteNome?: string };

const NfeActionButton = ({ venda, onPrepareNFe }: { venda: VendaComDetalhes, onPrepareNFe: (venda: VendaComDetalhes) => void }) => {
    const status = venda.nfe?.status;
    const isPaid = venda.status === 'Paga';

    if (!isPaid) {
        return <Badge variant="outline">Aguardando Pagamento</Badge>;
    }

    switch (status) {
        case 'autorizado':
            return (
                <div className="flex gap-2">
                    <TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="sm" variant="outline" asChild><a href={venda.nfe?.url_danfe} target="_blank" rel="noopener noreferrer"><IconFileDownload className="h-4 w-4"/></a></Button></TooltipTrigger><TooltipContent><p>Baixar DANFE</p></TooltipContent></Tooltip></TooltipProvider>
                    <TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="sm" variant="outline" asChild><a href={venda.nfe?.url_xml} target="_blank" rel="noopener noreferrer"><IconFileX className="h-4 w-4"/></a></Button></TooltipTrigger><TooltipContent><p>Baixar XML</p></TooltipContent></Tooltip></TooltipProvider>
                </div>
            );
        case 'processando_autorizacao':
            return <Button size="sm" variant="secondary" disabled><IconLoader className="h-4 w-4 animate-spin mr-2"/>Processando...</Button>;
        case 'erro_autorizacao':
            return (
                <TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="sm" variant="destructive" onClick={() => onPrepareNFe(venda)}><IconAlertTriangle className="h-4 w-4 mr-2"/>Erro</Button></TooltipTrigger><TooltipContent><p>Houve um erro. Clique para corrigir e tentar novamente.</p></TooltipContent></Tooltip></TooltipProvider>
            );
        case 'cancelado':
            return <Badge variant="secondary">Cancelada</Badge>;
        default:
            return <Button size="sm" onClick={() => onPrepareNFe(venda)}><IconFileInvoice className="h-4 w-4 mr-2"/>Emitir NF-e</Button>;
    }
}

const renderSubComponent = ({ row }: { row: Row<VendaComDetalhes> }) => {
    return (
        <div className="p-4 bg-muted/20">
            <h4 className="font-semibold text-sm mb-2">Itens da Venda</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {row.original.produtos.map((p, i) => (
                    <div key={i} className="text-xs p-2.5 border rounded-lg bg-background shadow-sm">
                        <p className="font-bold text-sm mb-1">{p.produtoNome}</p>
                        <p><strong>Quantidade:</strong> {p.quantidade}</p>
                        <p><strong>Preço Un.:</strong> R$ {p.precoUnitario.toFixed(2)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface VendasTableProps {
    vendas: VendaComDetalhes[];
    onEdit: (venda: VendaComDetalhes) => void;
    onPrepareNFe: (venda: VendaComDetalhes) => void;
    isReadOnly: boolean;
}

export function VendasTable({ vendas, onEdit, onPrepareNFe, isReadOnly }: VendasTableProps) {
    const columns: ColumnDef<VendaComDetalhes>[] = [
        { header: "Data", accessorKey: "data", cell: ({ row }) => format(new Date(row.original.data), 'dd/MM/yyyy') },
        { header: "Cliente", accessorKey: "clienteNome" },
        { header: "Valor Final", cell: ({ row }) => `R$ ${(row.original.valorFinal || row.original.valorTotal).toFixed(2)}` },
        { header: "Pagamento", cell: ({ row }) => <Badge variant={row.original.status === 'Paga' ? 'success' : 'warning'}>{row.original.status}</Badge> },
        { id: "nfe_status_action", header: "NF-e", cell: ({ row }) => <NfeActionButton venda={row.original} onPrepareNFe={onPrepareNFe} /> },
        { id: "edit_action", cell: ({ row }) => ( <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => onEdit(row.original)} disabled={isReadOnly}><IconPencil className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Editar Venda</p></TooltipContent></Tooltip></TooltipProvider> )}
    ];

    return (
        <GenericTable
            columns={columns}
            data={vendas}
            filterPlaceholder="Pesquisar por cliente..."
            filterColumnId="clienteNome"
            renderSubComponent={renderSubComponent}
        />
    )
}
