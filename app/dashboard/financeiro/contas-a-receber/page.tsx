"use client"

import { useEffect, useState, useMemo, useCallback } from "react";
import { onSnapshot, collection, doc, updateDoc, Timestamp } from "firebase/firestore";
import { ColumnDef, Row } from "@tanstack/react-table";
import { format } from "date-fns";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { GenericTable } from "@/components/generic-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useDataStore } from "@/store/data.store";
import { useAuthStore } from "@/store/auth.store";
import { subscribeToContasAReceber, receberPagamento } from "@/lib/services/contasAReceber.services";
import { ContaAReceber } from "@/lib/schemas";
import { DetailsSubRow } from "@/components/details-sub-row";
import Link from "next/link";
import { IconLoader } from "@tabler/icons-react";

type ContaComNome = ContaAReceber & { clienteNome?: string };

export default function ContasAReceberPage() {
    const [contas, setContas] = useState<ContaAReceber[]>([]);
    const { clientes, contasBancarias } = useDataStore();
    const { user, role } = useAuthStore();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedConta, setSelectedConta] = useState<ContaAReceber | null>(null);
    const [selectedContaBancaria, setSelectedContaBancaria] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const unsubContas = subscribeToContasAReceber((data) => {
            const contasComDataConvertida = data.map(c => ({
                ...c,
                dataEmissao: c.dataEmissao instanceof Timestamp ? c.dataEmissao.toDate() : c.dataEmissao,
                dataVencimento: c.dataVencimento instanceof Timestamp ? c.dataVencimento.toDate() : c.dataVencimento
            }));
            setContas(contasComDataConvertida);
        });

        return () => unsubContas();
    }, []);

    const handleOpenDialog = (conta: ContaAReceber) => {
        setSelectedConta(conta);
        setIsDialogOpen(true);
    };

    const handleConfirmRecebimento = async () => {
        if (!selectedConta || !selectedContaBancaria || !user) {
            toast.error("Selecione uma conta bancária para continuar.");
            return;
        }

        setIsProcessing(true);
        try {
            await receberPagamento(selectedConta, selectedContaBancaria, user);
            toast.success("Conta recebida e baixada com sucesso!");
            setIsDialogOpen(false);
        } catch (error: any) {
            toast.error("Falha ao processar recebimento.", { description: error.message });
        } finally {
            setIsProcessing(false);
            setSelectedConta(null);
            setSelectedContaBancaria("");
        }
    };

    const contasComCliente = useMemo(() => {
        return contas.map(conta => ({
            ...conta,
            clienteNome: clientes.find(c => c.id === conta.clienteId)?.nome || "N/A"
        }));
    }, [contas, clientes]);

    const renderSubComponent = useCallback(({ row }: { row: Row<ContaComNome> }) => {
        const conta = row.original;
        const details = [
            { label: "Data de Emissão", value: format(new Date(conta.dataEmissao), 'dd/MM/yyyy') },
            { label: "Venda de Origem", value: <Button asChild variant="link" size="sm" className="p-0 h-auto"><Link href={`/dashboard/vendas?vendaId=${conta.vendaId}`}>Ver Venda</Link></Button> },
            { label: "ID da Conta", value: conta.id, className: "col-span-1 sm:col-span-2" },
        ];
        return <DetailsSubRow details={details} />;
    }, []);

    const columns: ColumnDef<ContaComNome>[] = [
        { header: "Cliente", accessorKey: "clienteNome" },
        { header: "Vencimento", accessorKey: "dataVencimento", cell: ({ row }) => row.original.dataVencimento ? format(row.original.dataVencimento, 'dd/MM/yyyy') : 'N/A' },
        { header: "Valor", accessorKey: "valor", cell: ({ row }) => `R$ ${row.original.valor.toFixed(2)}`},
        { header: "Status", accessorKey: "status", cell: ({ row }) => (
            <Badge variant={row.original.status === 'Pendente' ? 'destructive' : 'default'}>
                {row.original.status}
            </Badge>
        )},
        { id: "actions", cell: ({ row }) => (
            <div className="text-right">
                {row.original.status === 'Pendente' && role === "ADMINISTRADOR" && (
                    <Button size="sm" onClick={() => handleOpenDialog(row.original)}>Dar Baixa (Receber)</Button>
                )}
            </div>
        )}
    ];

    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Recebimento</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                         <p>Confirme a baixa para a conta no valor de <span className="font-semibold text-lg">R$ {selectedConta?.valor.toFixed(2)}</span>.</p>
                         <div className="space-y-2">
                            <Label htmlFor="conta-bancaria">Selecione a conta de destino do recebimento</Label>
                             <Select onValueChange={setSelectedContaBancaria} value={selectedContaBancaria}>
                                <SelectTrigger id="conta-bancaria">
                                    <SelectValue placeholder="Selecione a conta..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {contasBancarias.map(conta => (
                                        <SelectItem key={conta.id} value={conta.id!}>{`${conta.nomeConta} (Saldo: R$ ${conta.saldoAtual?.toFixed(2)})`}</SelectItem>
                                    ))}
                                </SelectContent>
                             </Select>
                         </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline" disabled={isProcessing}>Cancelar</Button></DialogClose>
                        <Button type="button" onClick={handleConfirmRecebimento} disabled={!selectedContaBancaria || isProcessing}>
                            {isProcessing && <IconLoader className="mr-2 h-4 w-4 animate-spin" />}
                            {isProcessing ? "Processando..." : "Confirmar Recebimento"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader>
                    <CardTitle>Contas a Receber</CardTitle>
                    <CardDescription>Visualize e gerencie as contas de vendas a prazo.</CardDescription>
                </CardHeader>
                <CardContent>
                    <GenericTable
                        columns={columns}
                        data={contasComCliente}
                        filterPlaceholder="Pesquisar por cliente..."
                        filterColumnId="clienteNome"
                        renderSubComponent={renderSubComponent}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
