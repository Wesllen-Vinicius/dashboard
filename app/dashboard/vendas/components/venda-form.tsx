"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray, Control, SubmitHandler, useController } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { IconPlus, IconTrash, IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";

import { useDataStore } from "@/store/data.store";
import { useAuthStore } from "@/store/auth.store";
import { Venda, vendaSchema } from "@/lib/schemas";
import { registrarVenda, updateVenda } from "@/lib/services/vendas.services";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/date-picker";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const itemVendidoFormSchema = z.object({
    produtoId: z.string().min(1, "Obrigatório"),
    produtoNome: z.string(),
    quantidade: z.coerce.number({ invalid_type_error: "Obrigatório" }).positive("Deve ser > 0."),
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

const steps = [
    { id: 1, name: "Cliente e Produtos", fields: ["clienteId", "data", "produtos"] as const },
    { id: 2, name: "Pagamento", fields: ["condicaoPagamento", "metodoPagamento", "contaBancariaId", "dataVencimento", "taxaCartao", "numeroParcelas"] as const },
];

const metodosPagamentoOptions = {
    vista: [
        { value: "Dinheiro", label: "Dinheiro" },
        { value: "PIX", label: "PIX" },
        { value: "Cartão de Débito", label: "Cartão de Débito" },
        { value: "Cartão de Crédito", label: "Cartão de Crédito" }
    ],
    prazo: [
        { value: "Boleto/Prazo", label: "Boleto/Prazo" },
        { value: "PIX", label: "PIX" },
        { value: "Dinheiro", label: "Dinheiro" }
    ]
};

const ItemProdutoVenda = ({ index, control, remove, handleProdutoChange, produtosParaVendaOptions }: {
    index: number, control: Control<VendaFormValues>, remove: (i: number) => void,
    handleProdutoChange: (i: number, id: string) => void, produtosParaVendaOptions: { label: string, value: string }[]
}) => {
    const { fieldState } = useController({ name: `produtos.${index}.quantidade`, control });
    const hasError = !!fieldState.error;

    return (
        <div className="flex flex-col md:flex-row gap-3 border rounded-lg p-3 bg-muted/50 relative">
            <div className="flex-1 min-w-[160px]">
                <FormField
                    name={`produtos.${index}.produtoId`}
                    control={control}
                    render={({ field }) => (
                        <FormItem>
                            <Select
                                onValueChange={(value) => { field.onChange(value); handleProdutoChange(index, value) }}
                                value={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Produto" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {produtosParaVendaOptions.map(p => (
                                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            {/* Quantidade */}
            <div className="w-full md:w-[90px]">
                <FormField
                    name={`produtos.${index}.quantidade`}
                    control={control}
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Input
                                    type="number"
                                    placeholder="Qtd"
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                                    className={hasError ? 'border-destructive' : ''}
                                />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
            </div>
            {/* Preço Unitário (agora editável!) */}
            <div className="w-full md:w-[120px]">
                <FormField
                    name={`produtos.${index}.precoUnitario`}
                    control={control}
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Preço"
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                                />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
            </div>
            {/* Botão remover */}
            <div className="flex items-center mt-1 md:mt-0">
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <IconTrash className="h-4 w-4 text-destructive" />
                </Button>
            </div>
        </div>
    )
};

interface VendaFormProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    vendaToEdit?: Venda | null;
}

export function VendaForm({ isOpen, onOpenChange, vendaToEdit }: VendaFormProps) {
    const { produtos, clientes, contasBancarias } = useDataStore();
    const { user, role } = useAuthStore();
    const isEditing = !!vendaToEdit;
    const isReadOnly = role !== 'ADMINISTRADOR';
    const [currentStep, setCurrentStep] = useState(0);

    const defaultValues: VendaFormValues = {
        clienteId: "", data: new Date(), produtos: [], condicaoPagamento: "A_VISTA", metodoPagamento: "",
        contaBancariaId: "", dataVencimento: new Date(), numeroParcelas: 1, taxaCartao: 0,
    };

    const form = useForm<VendaFormValues>({
        resolver: zodResolver(formVendaSchema),
        defaultValues,
        mode: "onChange"
    });

    const { control, watch, setValue, handleSubmit, reset, trigger } = form;
    const { fields, append, remove } = useFieldArray({ control, name: "produtos" });
    const watchedProdutos = watch("produtos");
    const condicaoPagamento = watch('condicaoPagamento');
    const metodoPagamento = watch('metodoPagamento');
    const taxaCartao = watch('taxaCartao');
    const numeroParcelas = watch('numeroParcelas');

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                reset(defaultValues);
                setCurrentStep(0);
            }, 150);
        } else if (isEditing && vendaToEdit) {
            reset({
                ...vendaToEdit,
                data: new Date(vendaToEdit.data),
                dataVencimento: vendaToEdit.dataVencimento ? new Date(vendaToEdit.dataVencimento) : undefined,
                produtos: vendaToEdit.produtos.map(p => ({
                    ...p,
                    estoqueDisponivel: produtos.find(prod => prod.id === p.produtoId)?.quantidade || 0
                }))
            });
        }
    }, [isOpen, isEditing, vendaToEdit, reset, produtos]);

    const nextStep = async () => {
        const fieldsToValidate = steps[currentStep].fields;
        const output = await trigger(fieldsToValidate, { shouldFocus: true });
        if (output && currentStep < steps.length - 1) {
            setCurrentStep(step => step + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) setCurrentStep(step => step - 1);
    };

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

    const produtosParaVendaOptions = useMemo(() =>
        produtos.filter(p => p.tipoProduto === 'VENDA').map(p => ({
            label: `${p.nome} (Estoque: ${p.quantidade || 0})`,
            value: p.id!
        })), [produtos]);
    const clientesOptions = useMemo(() => clientes.map(c => ({ label: c.nomeRazaoSocial, value: c.id! })), [clientes]);
    const contasBancariasOptions = useMemo(() => contasBancarias.map(c => ({
        label: `${c.nomeConta} (${c.banco})`, value: c.id!
    })), [contasBancarias]);

    const handleProdutoChange = (index: number, produtoId: string) => {
        const produto = produtos.find(p => p.id === produtoId);
        if (produto && produto.tipoProduto === 'VENDA') {
            setValue(`produtos.${index}`, {
                produtoId,
                produtoNome: produto.nome,
                precoUnitario: produto.precoVenda || 0,
                custoUnitario: produto.custoUnitario || 0,
                estoqueDisponivel: produto.quantidade || 0,
                quantidade: 1
            });
        }
    };

    const onSubmit: SubmitHandler<VendaFormValues> = async (values) => {
        if (!user) return toast.error("Usuário não autenticado.");

        const dataPayload = {
            ...values,
            valorTotal: valoresCalculados.valorTotal,
            valorFinal: valoresCalculados.valorFinal,
            registradoPor: { uid: user.uid, nome: user.displayName || 'Usuário' }
        };

        const promise = isEditing && vendaToEdit?.id
            ? updateVenda(vendaToEdit.id, dataPayload)
            : registrarVenda(dataPayload as unknown as Omit<Venda, 'id'>, "");

        toast.promise(promise, {
            loading: isEditing ? "Atualizando..." : "Registrando...",
            success: () => {
                onOpenChange(false);
                return `Venda ${isEditing ? 'atualizada' : 'registrada'}!`;
            },
            error: (err: any) => `Falha ao salvar: ${err.message}`
        });
    };

    const progress = ((currentStep + 1) / steps.length) * 100;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Venda" : "Registrar Nova Venda"}</DialogTitle>
                </DialogHeader>
                <Progress value={progress} className="w-full h-2 mt-2" />
                <Form {...form}>
                    <form onSubmit={handleSubmit(onSubmit)} id="venda-form" className="py-4 min-h-[400px]">
                        <AnimatePresence mode="wait">
                            <motion.div key={currentStep} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }}>
                                {currentStep === 0 && (
                                    <fieldset disabled={isReadOnly} className="space-y-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <FormField name="clienteId" control={control} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Cliente</FormLabel>
                                                    <Combobox options={clientesOptions} {...field} value={field.value ?? ''} placeholder="Selecione um cliente" />
                                                </FormItem>
                                            )} />
                                            <FormField name="data" control={control} render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Data da Venda</FormLabel>
                                                    <DatePicker date={field.value} onDateChange={field.onChange} />
                                                </FormItem>
                                            )} />
                                        </div>
                                        <fieldset disabled={!watch("clienteId")} className="disabled:opacity-50">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-lg">Produtos da Venda</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="flex flex-col gap-4">
                                                        {fields.map((field, index) => (
                                                            <ItemProdutoVenda
                                                                key={field.id}
                                                                index={index}
                                                                control={control}
                                                                remove={remove}
                                                                handleProdutoChange={handleProdutoChange}
                                                                produtosParaVendaOptions={produtosParaVendaOptions}
                                                            />
                                                        ))}
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="mt-4"
                                                        onClick={() =>
                                                            append({
                                                                produtoId: '',
                                                                quantidade: 1,
                                                                precoUnitario: 0,
                                                                produtoNome: '',
                                                                custoUnitario: 0,
                                                                estoqueDisponivel: 0
                                                            })
                                                        }
                                                    >
                                                        <IconPlus className="mr-2 h-4 w-4" /> Adicionar Produto
                                                    </Button>
                                                    {fields.length === 0 && (
                                                        <p className="text-sm text-center text-muted-foreground py-4">
                                                            Nenhum produto adicionado.
                                                        </p>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </fieldset>
                                    </fieldset>
                                )}
                                {currentStep === 1 && (
                                    <fieldset disabled={isReadOnly || fields.length === 0} className="space-y-4 disabled:opacity-50">
                                        <div className="grid md:grid-cols-2 gap-4 items-start">
                                            <FormField name="condicaoPagamento" control={control} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Condição</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="A_VISTA">À Vista</SelectItem>
                                                            <SelectItem value="A_PRAZO">A Prazo</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )} />
                                            {condicaoPagamento === "A_VISTA" ? (
                                                <FormField name="metodoPagamento" control={control} render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Método</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Selecione..." />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {metodosPagamentoOptions.vista.map((opt) => (
                                                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )} />
                                            ) : (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <FormField name="metodoPagamento" control={control} render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Método</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Selecione..." />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {metodosPagamentoOptions.prazo.map((opt) => (
                                                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )} />
                                                    <FormField name="dataVencimento" control={control} render={({ field }) => (
                                                        <FormItem className="flex flex-col">
                                                            <FormLabel>Vencimento</FormLabel>
                                                            <DatePicker date={field.value} onDateChange={field.onChange} />
                                                        </FormItem>
                                                    )} />
                                                </div>
                                            )}
                                        </div>
                                    </fieldset>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </form>
                </Form>
                <DialogFooter className="flex-col sm:flex-row sm:justify-between items-center pt-6 border-t mt-6">
                    <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Valor Final</p>
                        <p className="text-3xl font-bold">R$ {valoresCalculados.valorFinal.toFixed(2)}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 0}>
                            <IconArrowLeft className="h-4 w-4 mr-2" />Voltar
                        </Button>
                        {currentStep < steps.length - 1 ? (
                            <Button type="button" onClick={nextStep}>
                                Avançar<IconArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        ) : (
                            <Button type="submit" form="venda-form" size="lg" disabled={!form.formState.isValid || form.formState.isSubmitting}>
                                {isEditing ? 'Salvar Alterações' : 'Finalizar Venda'}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
