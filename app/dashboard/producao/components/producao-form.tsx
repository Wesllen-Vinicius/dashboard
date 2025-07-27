"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm, useFieldArray, useWatch, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { IconTrash, IconPlus, IconTargetArrow, IconTag } from "@tabler/icons-react";
import { format, addDays } from "date-fns";

import { Producao, producaoSchema, Produto, ProdutoVenda } from "@/lib/schemas";
import { useAuthStore } from "@/store/auth.store";
import { useDataStore } from "@/store/data.store";
import { addProducao, updateProducao } from "@/lib/services/producao.services";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/date-picker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatNumber } from "@/lib/utils/formatters";
import { Tooltip, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const itemProduzidoFormSchema = z.object({
    produtoId: z.string().min(1, "Selecione um produto."),
    quantidade: z.coerce.number({ invalid_type_error: "Inválido" }).positive("Deve ser > 0."),
});

const formSchema = producaoSchema.pick({ data: true, responsavelId: true, abateId: true, descricao: true }).extend({
    produtos: z.array(itemProduzidoFormSchema).min(1, "Adicione pelo menos um produto."),
});

type ProducaoFormValues = z.infer<typeof formSchema>;

interface ResumoAbate {
    id: string;
    animaisValidos: number;
    metas: { produtoId: string; produtoNome: string; meta: number; unidade: string; }[];
}

function ItemRow({ control, index, remove, produtosData }: {
    control: Control<ProducaoFormValues>;
    index: number;
    remove: (index: number) => void;
    produtosData: {
        options: { label: string; value: string; }[];
        produtos: Produto[];
    };
}) {
    const produtoId = useWatch({ control, name: `produtos.${index}.produtoId` });
    const produtoSelecionado = produtoId ? produtosData.produtos.find(p => p.id === produtoId) : null;
    const controlaLote = (produtoSelecionado?.tipoProduto === 'VENDA' && produtoSelecionado.controlaLote);

    return (
        <motion.div className="flex items-end gap-2 p-3 border rounded-md" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10 }}>
            <FormField name={`produtos.${index}.produtoId`} control={control} render={({ field }) => (
                <FormItem className="flex-1">
                    <div className="flex items-center justify-between">
                         <FormLabel>Produto *</FormLabel>
                         {controlaLote && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <IconTag className="h-4 w-4 text-primary" />
                                    </TooltipTrigger>
                                    <p>Este produto controla lote.</p>
                                </Tooltip>
                            </TooltipProvider>
                         )}
                    </div>
                    <Combobox options={produtosData.options} placeholder="Selecione..." {...field} value={field.value ?? ''} />
                </FormItem>
            )} />
            <FormField name={`produtos.${index}.quantidade`} control={control} render={({ field }) => (
                <FormItem className="w-40"><FormLabel>Qtd. Produzida *</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0,00" {...field} value={field.value ?? ''} /></FormControl></FormItem>
            )} />
            <Button type="button" size="icon" variant="destructive" onClick={() => remove(index)}><IconTrash className="h-4 w-4" /></Button>
        </motion.div>
    );
}

const defaultValues: ProducaoFormValues = {
    data: new Date(),
    responsavelId: "",
    abateId: "",
    produtos: [],
    descricao: "",
};

export function ProducaoForm({ isOpen, onOpenChange, producaoToEdit }: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    producaoToEdit?: Producao | null;
}) {
    const { user } = useAuthStore();
    const { funcionarios, abates, produtos, unidades } = useDataStore();
    const isEditing = !!producaoToEdit;
    const [resumoAbate, setResumoAbate] = useState<ResumoAbate | null>(null);

    const form = useForm<ProducaoFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues,
        mode: 'onChange',
    });

    const { fields, append, remove } = useFieldArray({ control: form.control, name: "produtos" });

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                form.reset(defaultValues);
                setResumoAbate(null);
            }, 150);
        } else if (isEditing && producaoToEdit) {
            form.reset({
                ...producaoToEdit,
                data: new Date(producaoToEdit.data),
            });
        }
    }, [isOpen, isEditing, producaoToEdit, form]);

    const abateIdSelecionado = useWatch({ control: form.control, name: "abateId" });

    useEffect(() => {
        if (abateIdSelecionado) {
            const abate = abates.find(a => a.id === abateIdSelecionado);
            if (abate) {
                const produtosComMeta = produtos.filter((p): p is ProdutoVenda => p.tipoProduto === 'VENDA' && !!p.metaPorAnimal);
                const metasCalculadas = produtosComMeta.map(p => ({
                    produtoId: p.id!,
                    produtoNome: p.nome,
                    meta: (abate.numeroAnimais - (abate.condenado || 0)) * (p.metaPorAnimal || 0),
                    unidade: unidades.find(u => u.id === p.unidadeId)?.sigla || 'un'
                }));
                setResumoAbate({
                    id: abate.id!,
                    animaisValidos: abate.numeroAnimais - (abate.condenado || 0),
                    metas: metasCalculadas
                });
            }
        } else {
            setResumoAbate(null);
        }
    }, [abateIdSelecionado, abates, produtos, unidades]);

    const produtosOptions = useMemo(() => ({
        options: produtos.map(p => ({ label: p.nome, value: p.id! })),
        produtos: produtos
    }), [produtos]);

    const abatesDisponiveis = useMemo(() =>
        abates
            .filter(a => a.status === 'Aguardando Processamento' || a.status === 'Em Processamento')
            .map(abate => ({
                label: `${abate.loteId || 'Lote sem ID'} - ${format(new Date(abate.data), "dd/MM/yy")}`,
                value: abate.id!
            })),
    [abates]);

    const onSubmit = async (values: ProducaoFormValues) => {
        if (!user) return toast.error("Autenticação necessária.");
        const abateSelecionado = abates.find(a => a.id === values.abateId);
        if (!abateSelecionado) return toast.error("Abate de origem inválido.");

        const loteProducao = abateSelecionado.loteId || `LOTE-${new Date(values.data).getTime()}`;

        // --- LÓGICA DE GERAÇÃO DE LOTE ---
        const novosLotes = values.produtos.reduce((acc, item) => {
            const produtoInfo = produtos.find(p => p.id === item.produtoId);

            if (produtoInfo?.tipoProduto === 'VENDA' && produtoInfo.controlaLote) {
                acc.push({
                    loteNumero: `${loteProducao}-${produtoInfo.sku || produtoInfo.id!.slice(0, 4)}`,
                    produtoId: item.produtoId,
                    produtoNome: produtoInfo.nome,
                    quantidadeInicial: item.quantidade,
                    quantidadeAtual: item.quantidade,
                    dataProducao: values.data,
                    dataValidade: addDays(values.data, produtoInfo.diasValidade || 0),
                });
            }
            return acc;
        }, [] as any[]);


        const produtosComPerdaCalculada = values.produtos.map(item => {
             const metaDoProduto = resumoAbate?.metas.find(m => m.produtoId === item.produtoId);
             const metaTeorica = metaDoProduto?.meta || 0;
             const perda = metaTeorica > item.quantidade ? metaTeorica - item.quantidade : 0;
             const produtoInfo = produtos.find(p => p.id === item.produtoId);
             return { ...item, produtoNome: produtoInfo?.nome || "N/A", perda };
        });

        const dataPayload = {
            ...values,
            produtos: produtosComPerdaCalculada,
            lote: loteProducao,
            registradoPor: { uid: user.uid, nome: user.displayName || "Usuário" },
            lotesGerados: novosLotes, // Enviando os lotes para o serviço
        };

        const promise = isEditing && producaoToEdit?.id
            ? updateProducao(producaoToEdit.id, dataPayload)
            : addProducao(dataPayload as any); // Tipagem ajustada

        toast.promise(promise, {
            loading: 'Salvando produção...',
            success: () => { onOpenChange(false); return `Produção salva!`; },
            error: (err: any) => `Falha ao salvar: ${err.message}`
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Produção" : "Registrar Nova Produção"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} id="producao-form" className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField name="data" control={form.control} render={({ field }) => (<FormItem><FormLabel>Data da Produção *</FormLabel><DatePicker date={field.value} onDateChange={field.onChange} /></FormItem>)}/>
                            <FormField name="responsavelId" control={form.control} render={({ field }) => (<FormItem><FormLabel>Responsável *</FormLabel><Combobox options={funcionarios.map(f => ({ label: f.nomeCompleto, value: f.id! }))} {...field} placeholder="Selecione" value={field.value ?? ''} /></FormItem>)}/>
                            <FormField name="abateId" control={form.control} render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Abate de Origem *</FormLabel><Combobox options={abatesDisponiveis} {...field} placeholder="Selecione um lote" value={field.value ?? ''} /></FormItem>)}/>
                        </div>

                        {resumoAbate && (
                             <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                                 <Alert>
                                     <IconTargetArrow className="h-4 w-4"/>
                                     <AlertTitle>Metas para este Lote ({resumoAbate.animaisValidos} animais)</AlertTitle>
                                     <AlertDescription><ul className="list-disc pl-5 mt-2 text-xs grid grid-cols-2 md:grid-cols-4 gap-x-4">{resumoAbate.metas.map(meta => (<li key={meta.produtoNome}><strong>{meta.produtoNome}:</strong> {formatNumber(meta.meta)} {meta.unidade}</li>))}</ul></AlertDescription>
                                 </Alert>
                             </motion.div>
                        )}

                        <div className="space-y-4 pt-4">
                            <div className="flex justify-between items-center"><h3 className="text-lg font-medium">Itens Produzidos</h3><Button type="button" size="sm" variant="outline" onClick={() => append({ produtoId: "" } as any)}><IconPlus className="mr-2 h-4 w-4" /> Adicionar</Button></div>
                            <AnimatePresence>
                                {fields.map((item, index) => <ItemRow key={item.id} control={form.control} index={index} remove={remove} produtosData={produtosOptions} />)}
                            </AnimatePresence>
                            {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Adicione pelo menos um produto.</p>}
                        </div>
                    </form>
                </Form>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit" form="producao-form" disabled={!form.formState.isValid || form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? "Salvando..." : "Salvar Produção"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
