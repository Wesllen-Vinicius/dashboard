"use client";

import { useEffect } from "react";
import { useForm, useFieldArray, useWatch, Control, UseFormSetValue } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { IconTrash, IconPlus } from "@tabler/icons-react";
import { format } from "date-fns";

import { Producao, producaoSchema, Produto } from "@/lib/schemas";
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

type ProducaoFormValues = z.infer<typeof producaoSchema>;

function ItemRow({ control, index, remove, setValue, produtos }: {
    control: Control<ProducaoFormValues>;
    index: number;
    remove: (index: number) => void;
    setValue: UseFormSetValue<ProducaoFormValues>;
    produtos: Produto[];
}) {
    const produtoId = useWatch({ control, name: `produtos.${index}.produtoId` });

    useEffect(() => {
        if (produtoId) {
            const produto = produtos.find(p => p.id === produtoId);
            if (produto) {
                setValue(`produtos.${index}.produtoNome`, produto.nome);
            }
        }
    }, [produtoId, index, setValue, produtos]);

    return (
        <motion.div className="flex items-end gap-2 p-3 border rounded-md" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10 }}>
            <FormField name={`produtos.${index}.produtoId`} control={control} render={({ field }) => (
              <FormItem className="flex-1"><FormLabel>Produto *</FormLabel>
                <Combobox options={produtos.map(p => ({ label: p.nome, value: p.id! }))} placeholder="Selecione..." {...field} />
                <FormMessage />
              </FormItem>
            )}/>
            <FormField name={`produtos.${index}.quantidade`} control={control} render={({ field }) => (
              <FormItem className="w-28"><FormLabel>Qtd Produzida *</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))}/></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField name={`produtos.${index}.perda`} control={control} render={({ field }) => (
              <FormItem className="w-28"><FormLabel>Perda</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))}/></FormControl><FormMessage /></FormItem>
            )}/>
            <Button type="button" size="icon" variant="destructive" onClick={() => remove(index)}><IconTrash className="h-4 w-4" /></Button>
        </motion.div>
    );
}


export function ProducaoForm({ isOpen, onOpenChange, producaoToEdit }: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    producaoToEdit?: Producao | null;
}) {
    const { user } = useAuthStore();
    const { funcionarios, abates, compras, produtos } = useDataStore();
    const isEditing = !!producaoToEdit;

    const form = useForm<ProducaoFormValues>({
        resolver: zodResolver(producaoSchema),
        defaultValues: isEditing ? { ...producaoToEdit, data: new Date(producaoToEdit.data) } : { data: new Date(), responsavelId: "", abateId: "", produtos: [], lote: "", descricao: "" },
    });

    useEffect(() => {
        if(isOpen) {
            form.reset(
                isEditing
                ? { ...producaoToEdit, data: new Date(producaoToEdit!.data) }
                : { data: new Date(), responsavelId: "", abateId: "", produtos: [], lote: "", descricao: "" }
            );
        }
    }, [isOpen, isEditing, producaoToEdit, form]);

    const { fields, append, remove } = useFieldArray({ control: form.control, name: "produtos" });

    const abatesOptions = abates.map(abate => {
        const compra = compras.find(c => c.id === abate.compraId);
        return {
            label: `Abate de ${format(new Date(abate.data), "dd/MM/yy")} (NF ${compra?.notaFiscal || '?'})`,
            value: abate.id!
        };
    });

    const onSubmit = async (values: ProducaoFormValues) => {
        if (!user || !user.role) return toast.error("Autenticação necessária.");

        const dataPayload = {
            ...values,
            registradoPor: {
                uid: user.uid,
                nome: user.displayName || "Usuário",
                role: user.role
            }
        };

        try {
            if (isEditing && producaoToEdit?.id) {
                await updateProducao(producaoToEdit.id, values);
                toast.success("Produção atualizada com sucesso!");
            } else {
                await addProducao(dataPayload as Omit<Producao, 'id' | 'status' | 'createdAt'>);
                toast.success("Nova produção registrada com sucesso!");
            }
            onOpenChange(false);
        } catch (error: any) {
            toast.error("Falha ao salvar a produção.", { description: error.message });
        }
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
                            <FormField name="responsavelId" control={form.control} render={({ field }) => (<FormItem><FormLabel>Responsável *</FormLabel><Combobox options={funcionarios.map(f => ({ label: f.nomeCompleto, value: f.id! }))} {...field} placeholder="Selecione um funcionário" /><FormMessage /></FormItem>)}/>
                            <FormField name="abateId" control={form.control} render={({ field }) => (<FormItem><FormLabel>Abate de Origem *</FormLabel><Combobox options={abatesOptions} {...field} placeholder="Selecione um abate" /><FormMessage /></FormItem>)}/>
                            <FormField name="lote" control={form.control} render={({ field }) => (<FormItem><FormLabel>Lote</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        </div>
                        <FormField name="descricao" control={form.control} render={({ field }) => (<FormItem><FormLabel>Descrição / Observações</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)}/>

                        <Separator />

                        <div className="space-y-4">
                            <div className="flex justify-between items-center"><h3 className="text-lg font-medium">Itens Produzidos</h3><Button type="button" size="sm" variant="outline" onClick={() => append({ produtoId: "", produtoNome: "", quantidade: 0, perda: 0 })}><IconPlus className="mr-2 h-4 w-4" /> Adicionar Produto</Button></div>
                            <AnimatePresence>
                                {fields.map((item, index) => <ItemRow key={item.id} control={form.control} index={index} remove={remove} setValue={form.setValue} produtos={produtos} />)}
                            </AnimatePresence>
                            {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Adicione pelo menos um produto.</p>}
                        </div>

                    </form>
                </Form>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit" form="producao-form" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? "Salvando..." : "Salvar Produção"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
