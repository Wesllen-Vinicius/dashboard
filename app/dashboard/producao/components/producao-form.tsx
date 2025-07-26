"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm, useFieldArray, useWatch, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { IconTrash, IconPlus, IconTargetArrow } from "@tabler/icons-react";
import { format } from "date-fns";

import { Producao, producaoSchema, Produto, Abate, ProdutoVenda, ProdutoMateriaPrima, itemProduzidoSchema } from "@/lib/schemas";
import { useAuthStore } from "@/store/auth.store";
import { useDataStore } from "@/store/data.store";
import { addProducao, updateProducao } from "@/lib/services/producao.services";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatNumber } from "@/lib/utils/formatters";

// Schema do formulário, garantindo que os campos obrigatórios sejam validados
const itemProduzidoFormSchema = z.object({
    produtoId: z.string().min(1, "Selecione um produto."),
    quantidade: z.coerce.number({invalid_type_error: "Inválido"}).positive("Deve ser > 0."),
});

const formSchema = producaoSchema.pick({ data: true, responsavelId: true, abateId: true, descricao: true }).extend({
    produtos: z.array(itemProduzidoFormSchema).min(1, "Adicione pelo menos um produto."),
});

type ProducaoFormValues = z.infer<typeof formSchema>;

interface ResumoAbate {
    id: string;
    animaisValidos: number;
    metas: {
        produtoId: string;
        produtoNome: string;
        meta: number;
        unidade: string;
    }[];
}

function ItemRow({ control, index, remove, produtos }: {
    control: Control<ProducaoFormValues>;
    index: number;
    remove: (index: number) => void;
    produtos: Produto[];
}) {
    return (
        <motion.div className="flex items-end gap-2 p-3 border rounded-md" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10 }}>
            <FormField name={`produtos.${index}.produtoId`} control={control} render={({ field }) => (
              <FormItem className="flex-1"><FormLabel>Produto *</FormLabel>
                <Combobox options={produtos.map(p => ({ label: p.nome, value: p.id! }))} placeholder="Selecione..." {...field} value={field.value ?? ''} />
                <FormMessage />
              </FormItem>
            )}/>
            <FormField name={`produtos.${index}.quantidade`} control={control} render={({ field }) => (
              <FormItem className="w-40"><FormLabel>Qtd. Produzida *</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0,00" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
            )}/>
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
                const produtosComMeta = produtos.filter((p): p is ProdutoVenda | ProdutoMateriaPrima => (p.tipoProduto === 'VENDA' || p.tipoProduto === 'MATERIA_PRIMA') && 'metaPorAnimal' in p);
                const metasCalculadas = produtosComMeta.map(p => {
                    const unidade = unidades.find(u => u.id === p.unidadeId);
                    return {
                        produtoId: p.id!,
                        produtoNome: p.nome,
                        meta: (abate.numeroAnimais - (abate.condenado || 0)) * (p.metaPorAnimal || 0),
                        unidade: unidade?.sigla || 'un'
                    }
                });
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

        const produtosComPerdaCalculada = values.produtos.map(item => {
            const produtoInfo = produtos.find(p => p.id === item.produtoId);
            const metaDoProduto = resumoAbate?.metas.find(m => m.produtoId === item.produtoId);
            const metaTeorica = metaDoProduto?.meta || 0;
            const perda = metaTeorica > item.quantidade ? metaTeorica - item.quantidade : 0;

            return { ...item, produtoNome: produtoInfo?.nome || "N/A", perda: perda };
        });

        const dataPayload = {
            ...values,
            produtos: produtosComPerdaCalculada,
            lote: abateSelecionado.loteId || `LOTE-${new Date(values.data).getTime()}`,
            registradoPor: { uid: user.uid, nome: user.displayName || "Usuário" }
        };

        const promise = isEditing && producaoToEdit?.id
            ? updateProducao(producaoToEdit.id, dataPayload)
            : addProducao(dataPayload as Omit<Producao, 'id' | 'status' | 'createdAt'>);

        toast.promise(promise, {
            loading: 'Salvando produção...',
            success: (res) => {
                onOpenChange(false);
                return `Produção ${isEditing ? 'atualizada' : 'registrada'} com sucesso!`;
            },
            error: (err: any) => `Falha ao salvar: ${err.message}`
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Produção" : "Registrar Nova Produção"}</DialogTitle>
                    <DialogDescription>Preencha os detalhes da produção. Pelo menos um item produzido é obrigatório.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} id="producao-form" className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField name="data" control={form.control} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Data da Produção *</FormLabel><DatePicker date={field.value} onDateChange={field.onChange} /><FormMessage /></FormItem>)}/>
                            <FormField name="responsavelId" control={form.control} render={({ field }) => (<FormItem><FormLabel>Responsável *</FormLabel><Combobox options={funcionarios.map(f => ({ label: f.nomeCompleto, value: f.id! }))} {...field} placeholder="Selecione um funcionário" value={field.value ?? ''} /><FormMessage /></FormItem>)}/>
                            <FormField name="abateId" control={form.control} render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Abate de Origem *</FormLabel><Combobox options={abatesDisponiveis} {...field} placeholder="Selecione um lote de abate" value={field.value ?? ''} /><FormMessage /></FormItem>)}/>
                        </div>
                        {resumoAbate && (
                             <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                                <Alert>
                                    <IconTargetArrow className="h-4 w-4"/>
                                    <AlertTitle>Metas para este Lote ({resumoAbate.animaisValidos} animais válidos)</AlertTitle>
                                    <AlertDescription>
                                        <ul className="list-disc pl-5 mt-2 text-xs grid grid-cols-2 md:grid-cols-4 gap-x-4">
                                            {resumoAbate.metas.map(meta => (
                                                <li key={meta.produtoNome}>
                                                    <strong>{meta.produtoNome}:</strong> {formatNumber(meta.meta)} {meta.unidade}
                                                </li>
                                            ))}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            </motion.div>
                        )}
                        <FormField name="descricao" control={form.control} render={({ field }) => (<FormItem><FormLabel>Descrição / Observações</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                        <Separator />
                        <div className="space-y-4">
                            <div className="flex justify-between items-center"><h3 className="text-lg font-medium">Itens Produzidos</h3><Button type="button" size="sm" variant="outline" onClick={() => append({ produtoId: "" } as any)}><IconPlus className="mr-2 h-4 w-4" /> Adicionar Produto</Button></div>
                            <AnimatePresence>
                                {fields.map((item, index) => <ItemRow key={item.id} control={form.control} index={index} remove={remove} produtos={produtos} />)}
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
