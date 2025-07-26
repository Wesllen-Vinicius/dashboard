"use client";

import { useEffect, useMemo } from "react";
import { useForm, useFieldArray, Control, SubmitHandler, useController } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { z } from "zod";

import { useDataStore } from "@/store/data.store";
import { useAuthStore } from "@/store/auth.store";
import { Venda, vendaSchema, Produto } from "@/lib/schemas";
import { registrarVenda, updateVenda } from "@/lib/services/vendas.services";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/date-picker";
import { Separator } from "@/components/ui/separator";

const itemVendidoFormSchema = z.object({
    produtoId: z.string().min(1, "Obrigatório"),
    produtoNome: z.string(),
    quantidade: z.coerce.number().positive("Deve ser > 0."),
    precoUnitario: z.coerce.number().min(0),
    custoUnitario: z.coerce.number().min(0),
    estoqueDisponivel: z.number(),
}).refine(
    (data) => data.quantidade <= data.estoqueDisponivel,
    (data) => ({ message: `Estoque: ${data.estoqueDisponivel}`, path: ["quantidade"] })
);

const formVendaSchema = vendaSchema.pick({
    clienteId: true, data: true, condicaoPagamento: true, metodoPagamento: true,
    contaBancariaId: true, numeroParcelas: true, taxaCartao: true, dataVencimento: true,
}).extend({
    produtos: z.array(itemVendidoFormSchema).min(1, "Adicione pelo menos um produto."),
});

type VendaFormValues = z.infer<typeof formVendaSchema>;

const metodosPagamentoOptions = {
    vista: [ { value: "Dinheiro", label: "Dinheiro" }, { value: "PIX", label: "PIX" }, { value: "Cartão de Débito", label: "Cartão de Débito" }, { value: "Cartão de Crédito", label: "Cartão de Crédito" } ],
    prazo: [ { value: "Boleto/Prazo", label: "Boleto/Prazo" }, { value: "PIX", label: "PIX" }, { value: "Dinheiro", label: "Dinheiro" } ]
};

const ItemProdutoVenda = ({ index, control, remove, handleProdutoChange, produtosParaVendaOptions }: {
    index: number, control: Control<VendaFormValues>, remove: (i: number) => void,
    handleProdutoChange: (i: number, id: string) => void, produtosParaVendaOptions: { label: string, value: string }[]
}) => {
    const { fieldState } = useController({ name: `produtos.${index}.quantidade`, control });
    const hasError = !!fieldState.error;

    return (
        <div className={`p-3 border rounded-md bg-muted/50 space-y-2 transition-all ${hasError ? 'border-destructive' : ''}`}>
            <div className="grid grid-cols-[1fr_80px_120px_auto] gap-2 items-start">
                <FormField name={`produtos.${index}.produtoId`} control={control} render={({ field }) => ( <FormItem><Select onValueChange={(value) => {field.onChange(value); handleProdutoChange(index, value)}} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Produto" /></SelectTrigger></FormControl><SelectContent>{produtosParaVendaOptions.map(p => (<SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem> )}/>
                <FormField name={`produtos.${index}.quantidade`} control={control} render={({ field }) => ( <FormItem><FormControl><Input type="number" placeholder="Qtd" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className={hasError ? 'border-destructive focus-visible:ring-destructive' : ''}/></FormControl></FormItem> )}/>
                <FormField name={`produtos.${index}.precoUnitario`} control={control} render={({ field }) => ( <FormItem><FormControl><Input type="number" placeholder="Preço" {...field} readOnly className="bg-muted-foreground/20" /></FormControl><FormMessage /></FormItem> )} />
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><IconTrash className="h-4 w-4 text-destructive" /></Button>
            </div>
            <FormField name={`produtos.${index}.quantidade`} control={control} render={() => <FormMessage />} />
        </div>
    )
}

interface VendaFormProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    vendaToEdit?: Venda | null;
}

export function VendaForm({ isOpen, onOpenChange, vendaToEdit }: VendaFormProps) {
    const { produtos, clientes, unidades, contasBancarias } = useDataStore();
    const { user, role } = useAuthStore();
    const isEditing = !!vendaToEdit;
    const isReadOnly = role !== 'ADMINISTRADOR';

    const defaultValues: VendaFormValues = {
        clienteId: "", data: new Date(), produtos: [], condicaoPagamento: "A_VISTA", metodoPagamento: "",
        contaBancariaId: "", dataVencimento: new Date(), numeroParcelas: 1, taxaCartao: 0,
    };

    const form = useForm<VendaFormValues>({
        resolver: zodResolver(formVendaSchema),
        defaultValues,
        mode: "onChange"
    });

    const { control, watch, setValue, handleSubmit, reset } = form;
    const { fields, append, remove } = useFieldArray({ control, name: "produtos" });
    const watchedProdutos = watch("produtos");
    const condicaoPagamento = watch('condicaoPagamento');
    const metodoPagamento = watch('metodoPagamento');
    const taxaCartao = watch('taxaCartao');
    const numeroParcelas = watch('numeroParcelas');

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => reset(defaultValues), 150);
        } else if (isEditing && vendaToEdit) {
            reset({
                ...vendaToEdit,
                data: new Date(vendaToEdit.data),
                dataVencimento: vendaToEdit.dataVencimento ? new Date(vendaToEdit.dataVencimento) : undefined,
                produtos: vendaToEdit.produtos.map(p => ({ ...p, estoqueDisponivel: produtos.find(prod => prod.id === p.produtoId)?.quantidade || 0 }))
            });
        }
    }, [isOpen, isEditing, vendaToEdit, reset, produtos]);

    const valoresCalculados = useMemo(() => {
        const valorTotal = watchedProdutos.reduce((acc, item) => acc + (item.quantidade || 0) * (item.precoUnitario || 0), 0);
        let valorFinal = valorTotal;
        if (metodoPagamento === 'Cartão de Crédito' && valorTotal > 0) {
            const taxaDecimal = (taxaCartao || 0) / 100;
            valorFinal = valorTotal * (1 + taxaDecimal);
        }
        const valorParcela = valorFinal > 0 && numeroParcelas ? valorFinal / numeroParcelas : 0;
        return { valorTotal, valorFinal, valorParcela };
    }, [watchedProdutos, metodoPagamento, taxaCartao, numeroParcelas]);

    const produtosParaVendaOptions = useMemo(() => produtos.filter(p => p.tipoProduto === 'VENDA').map(p => ({ label: `${p.nome} (Estoque: ${p.quantidade || 0} ${unidades.find(u => u.id === p.unidadeId)?.sigla || 'un'})`, value: p.id! })), [produtos, unidades]);
    const clientesOptions = useMemo(() => clientes.map(c => ({ label: c.nomeRazaoSocial, value: c.id! })), [clientes]);
    const contasBancariasOptions = useMemo(() => contasBancarias.map(c => ({ label: `${c.nomeConta} (${c.banco})`, value: c.id! })), [contasBancarias]);

    const handleProdutoChange = (index: number, produtoId: string) => {
        const produto = produtos.find(p => p.id === produtoId) as Produto & { precoVenda?: number };
        if (produto) {
            setValue(`produtos.${index}`, {
                produtoId, produtoNome: produto.nome, precoUnitario: produto.precoVenda || 0,
                custoUnitario: produto.custoUnitario || 0, estoqueDisponivel: produto.quantidade || 0, quantidade: 1
            });
        }
    };

    const onSubmit: SubmitHandler<VendaFormValues> = async (values) => {
        if (!user) return toast.error("Usuário não autenticado.");
        const cliente = clientes.find(c => c.id === values.clienteId);
        if (!cliente) return toast.error("Cliente não encontrado.");

        const valorTotal = valoresCalculados.valorTotal;
        const valorFinal = valoresCalculados.valorFinal;

        const dataPayload = {
            ...values,
            valorTotal,
            valorFinal,
            registradoPor: { uid: user.uid, nome: user.displayName || 'Usuário' }
        };

        const promise = isEditing && vendaToEdit?.id
            ? updateVenda(vendaToEdit.id, dataPayload)
            : registrarVenda(dataPayload as Omit<Venda, 'id' | 'status'>, cliente.nomeRazaoSocial);

        toast.promise(promise, {
            loading: isEditing ? "Atualizando venda..." : "Registrando venda...",
            success: () => {
                onOpenChange(false);
                return `Venda ${isEditing ? 'atualizada' : 'registrada'} com sucesso!`;
            },
            error: (err: any) => `Falha ao salvar: ${err.message}`
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Venda" : "Registrar Nova Venda"}</DialogTitle>
                    <DialogDescription>Preencha os dados para registrar uma nova venda.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={handleSubmit(onSubmit)} id="venda-form" className="space-y-6 py-4 max-h-[80vh] overflow-y-auto pr-2">
                        <fieldset disabled={isReadOnly} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField name="clienteId" control={control} render={({ field }) => (<FormItem><FormLabel>Cliente</FormLabel><Combobox options={clientesOptions} {...field} placeholder="Selecione um cliente" /></FormItem>)} />
                                <FormField name="data" control={control} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Data da Venda</FormLabel><FormControl><DatePicker date={field.value} onDateChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <Separator />
                            <fieldset disabled={!watch("clienteId")} className="space-y-3 disabled:opacity-50">
                                <FormLabel>Produtos Vendidos</FormLabel>
                                {fields.map((field, index) => (<ItemProdutoVenda key={field.id} index={index} control={control} remove={remove} handleProdutoChange={handleProdutoChange} produtosParaVendaOptions={produtosParaVendaOptions} />))}
                                <Button type="button" variant="outline" size="sm" onClick={() => append({} as any)} disabled={!watch("clienteId")}><IconPlus className="mr-2 h-4 w-4" /> Adicionar Produto</Button>
                            </fieldset>
                            <Separator />
                            <fieldset disabled={fields.length === 0} className="space-y-4 disabled:opacity-50">
                                <div className="grid md:grid-cols-2 gap-4 items-start">
                                    <FormField name="condicaoPagamento" control={control} render={({ field }) => (<FormItem><FormLabel>Condição</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="A_VISTA">À Vista</SelectItem><SelectItem value="A_PRAZO">A Prazo</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                    {condicaoPagamento === "A_VISTA" ? (
                                        <FormField name="metodoPagamento" control={control} render={({ field }) => (<FormItem><FormLabel>Método</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{metodosPagamentoOptions.vista.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4"><FormField name="metodoPagamento" control={control} render={({ field }) => (<FormItem><FormLabel>Método</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{metodosPagamentoOptions.prazo.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} /><FormField name="dataVencimento" control={control} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Vencimento</FormLabel><FormControl><DatePicker date={field.value} onDateChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} /></div>
                                    )}
                                </div>
                                <FormField name="contaBancariaId" control={control} render={({ field }) => (<FormItem><FormLabel>Conta de Destino</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione a conta..." /></SelectTrigger></FormControl><SelectContent>{contasBancariasOptions.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent></Select><FormDescription>Onde o valor da venda será creditado.</FormDescription><FormMessage /></FormItem>)} />
                                {metodoPagamento === "Cartão de Crédito" && (<div className="grid md:grid-cols-3 gap-4 items-end pt-4"><FormField name="taxaCartao" control={control} render={({ field }) => (<FormItem><FormLabel>Taxa (%)</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>)} /><FormField name="numeroParcelas" control={control} render={({ field }) => (<FormItem><FormLabel>Parcelas</FormLabel><Select onValueChange={(v) => field.onChange(parseInt(v))} value={String(field.value)}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{Array.from({ length: 12 }, (_, i) => i + 1).map((p) => (<SelectItem key={p} value={String(p)}>{p}x</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} /><div className="text-right"><p className="text-sm text-muted-foreground">Valor Parcela</p><p className="text-lg font-bold">R$ {valoresCalculados.valorParcela.toFixed(2)}</p></div></div>)}
                            </fieldset>
                        </fieldset>
                    </form>
                </Form>
                <DialogFooter className="flex-col sm:flex-row sm:justify-between items-center pt-6 border-t mt-6">
                    <div><p className="text-sm text-muted-foreground">Valor Final da Venda</p><p className="text-3xl font-bold">R$ {valoresCalculados.valorFinal.toFixed(2).replace(".", ",")}</p></div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" form="venda-form" size="lg" disabled={!form.formState.isValid || form.formState.isSubmitting}>{isEditing ? 'Salvar Alterações' : 'Finalizar Venda'}</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
