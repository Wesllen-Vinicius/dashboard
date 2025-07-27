"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconAlertTriangle } from "@tabler/icons-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Cliente, CompanyInfo, Venda, Produto, Unidade, ProdutoVenda } from "@/lib/schemas";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "./ui/separator";

// Schema de preview corrigido para aceitar campos opcionais
const previewSchema = z.object({
    nomeRazaoSocial: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
    endereco: z.object({
        logradouro: z.string().optional(),
        numero: z.string().optional(),
        bairro: z.string().optional(),
        cidade: z.string().optional(),
        uf: z.string().optional(),
        cep: z.string().optional(),
    }).optional()
});

type PreviewFormValues = z.infer<typeof previewSchema>;

interface NfePreviewModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    previewData: {
        venda: Venda;
        empresa: CompanyInfo;
        cliente: Cliente;
        todosProdutos: Produto[];
        todasUnidades: Unidade[];
    } | null;
    onSubmit: (data: any) => void;
    isLoading: boolean;
}

const FormInputBox = ({ name, label, control, disabled = false, className }: { name: any, label: string, control: any, disabled?: boolean, className?: string }) => (
    <div className={className}>
        <FormLabel className="text-[10px] text-muted-foreground uppercase">{label}</FormLabel>
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormControl>
                        <Input className="h-9 text-sm" {...field} value={field.value || ''} />
                    </FormControl>
                </FormItem>
            )}
        />
    </div>
)

const DataRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between items-start text-xs">
        <span className="text-muted-foreground">{label}:</span>
        <span className="text-right font-medium text-foreground">{value}</span>
    </div>
);

export function NfePreviewModal({ isOpen, onOpenChange, previewData, onSubmit, isLoading }: NfePreviewModalProps) {
    const form = useForm<PreviewFormValues>({
        resolver: zodResolver(previewSchema),
    });

    useEffect(() => {
        if (previewData?.cliente) {
            form.reset({
                nomeRazaoSocial: previewData.cliente.nomeRazaoSocial,
                endereco: previewData.cliente.endereco,
            });
        }
    }, [previewData, form]);

    if (!previewData) return null;

    const { venda, empresa, cliente, todosProdutos, todasUnidades } = previewData;
    const valorTotal = venda.valorTotal || 0;
    const valorFinal = venda.valorFinal ?? valorTotal;

    const handleFormSubmit = (data: PreviewFormValues) => {
        const finalData = {
            ...previewData,
            cliente: {
                ...cliente,
                nomeRazaoSocial: data.nomeRazaoSocial,
                endereco: data.endereco
            }
        };
        onSubmit(finalData);
    }

    const SectionTitle = ({ children }: { children: React.ReactNode }) => (
        <h3 className="text-xs uppercase font-semibold text-center my-1 text-muted-foreground">{children}</h3>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl w-full max-h-[95vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Revisão para Emissão da NF-e</DialogTitle>
                </DialogHeader>

                <Alert variant="destructive" className="bg-amber-100 border-amber-300">
                    <IconAlertTriangle className="h-5 w-5 !text-amber-700" />
                    <AlertTitle className="font-bold !text-amber-800">Atenção: Modo de Pré-visualização</AlertTitle>
                    <AlertDescription className="!text-amber-700">
                        Este é um rascunho. Verifique as informações antes de emitir a nota fiscal.
                    </AlertDescription>
                </Alert>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} id="nfe-confirm-form" className="flex-grow min-h-0 mt-4">
                        <ScrollArea className="h-full w-full border rounded-md p-4 bg-background">
                            <div className="danfe-container space-y-2 text-foreground">
                                <section className="border border-muted-foreground p-2 rounded-t-md">
                                    <SectionTitle>Emitente</SectionTitle>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                                        <DataRow label="Razão Social" value={empresa.razaoSocial} />
                                        <DataRow label="CNPJ" value={empresa.cnpj} />
                                    </div>
                                </section>

                                <section className="border border-muted-foreground p-2">
                                    <SectionTitle>Destinatário</SectionTitle>
                                    <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mt-1">
                                        <FormInputBox name="nomeRazaoSocial" label="Nome / Razão Social" control={form.control} className="md:col-span-6" />
                                        <FormInputBox name="endereco.logradouro" label="Endereço" control={form.control} className="md:col-span-4" />
                                        <FormInputBox name="endereco.bairro" label="Bairro" control={form.control} className="md:col-span-2" />
                                    </div>
                                </section>

                                <section className="border border-muted-foreground p-1">
                                    <SectionTitle>Dados dos Produtos</SectionTitle>
                                    <Table className="text-xs">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>DESCRIÇÃO</TableHead>
                                                <TableHead className="text-center">NCM</TableHead>
                                                <TableHead className="text-center">CFOP</TableHead>
                                                <TableHead className="text-right">QTD</TableHead>
                                                <TableHead className="text-right">VLR. UNIT.</TableHead>
                                                <TableHead className="text-right">VLR. TOTAL</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {venda.produtos.map((item) => {
                                                const produtoCompleto = todosProdutos.find(p => p.id === item.produtoId);
                                                // Adicionando a verificação de tipo de produto
                                                if (produtoCompleto && produtoCompleto.tipoProduto === 'VENDA') {
                                                    const unidade = todasUnidades.find(u => u.id === produtoCompleto.unidadeId);
                                                    return (
                                                        <TableRow key={item.produtoId}>
                                                            <TableCell>{item.produtoNome}</TableCell>
                                                            <TableCell className="text-center font-mono">{produtoCompleto.ncm}</TableCell>
                                                            <TableCell className="text-center font-mono">{produtoCompleto.cfop}</TableCell>
                                                            <TableCell className="text-right font-mono">{item.quantidade.toFixed(2)}</TableCell>
                                                            <TableCell className="text-right font-mono">{item.precoUnitario.toFixed(2)}</TableCell>
                                                            <TableCell className="text-right font-mono">{(item.quantidade * item.precoUnitario).toFixed(2)}</TableCell>
                                                        </TableRow>
                                                    )
                                                }
                                                return null
                                            })}
                                        </TableBody>
                                    </Table>
                                </section>

                                <section className="border border-muted-foreground p-2 rounded-b-md">
                                    <div className="flex justify-end">
                                        <div className="w-1/3 space-y-1">
                                            <DataRow label="Subtotal" value={`R$ ${valorTotal.toFixed(2)}`} />
                                            {(valorFinal > valorTotal) &&
                                                <DataRow label="Acréscimos (Taxa)" value={`R$ ${(valorFinal - valorTotal).toFixed(2)}`} />
                                            }
                                            <Separator className="my-1" />
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="font-semibold">VALOR TOTAL NF-e</span>
                                                <span className="font-bold text-base">R$ {valorFinal.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </ScrollArea>
                    </form>
                </Form>
                <DialogFooter className="mt-4 pt-4 border-t">
                    <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                    <Button type="submit" form="nfe-confirm-form" disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white">
                        {isLoading ? "Emitindo..." : "Confirmar e Emitir NF-e"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
