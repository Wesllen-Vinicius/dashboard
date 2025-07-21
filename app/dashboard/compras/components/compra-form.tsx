"use client";

import { useEffect } from "react";
import { useForm, useFieldArray, useWatch, Control, UseFormSetValue } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { IconTrash, IconPlus } from "@tabler/icons-react";

import { Compra, compraSchema, UserInfo, Produto, Fornecedor, ContaBancaria } from "@/lib/schemas";
import { useAuthStore } from "@/store/auth.store";
import { useDataStore } from "@/store/data.store";
import { addCompra, updateCompra } from "@/lib/services/compras.services";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type CompraFormValues = z.infer<typeof compraSchema>;
type ItemCompra = CompraFormValues["itens"][0];

function ItemRow({ control, index, remove, setValue, produtos }: {
    control: Control<CompraFormValues>;
    index: number;
    remove: (index: number) => void;
    setValue: UseFormSetValue<CompraFormValues>;
    produtos: Produto[];
}) {
    const produtoId = useWatch({ control, name: `itens.${index}.produtoId` });

    useEffect(() => {
        if (produtoId) {
            const produto = produtos.find(p => p.id === produtoId);
            if (produto && produto.tipoProduto !== 'USO_INTERNO') {
                setValue(`itens.${index}.produtoNome`, produto.nome);
                setValue(`itens.${index}.custoUnitario`, produto.custoUnitario || 0);
            }
        }
    }, [produtoId, index, setValue, produtos]);

    return (
        <motion.div className="flex items-end gap-2 p-3 border rounded-md" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <FormField name={`itens.${index}.produtoId`} control={control} render={({ field }) => (
              <FormItem className="flex-1"><FormLabel>Produto *</FormLabel>
                <Combobox options={produtos.map(p => ({ label: p.nome, value: p.id! }))} placeholder="Selecione..." searchPlaceholder="Buscar produto..." {...field} />
                <FormMessage />
              </FormItem>
            )}/>
            <FormField name={`itens.${index}.quantidade`} control={control} render={({ field }) => (
              <FormItem className="w-28"><FormLabel>Qtd *</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))}/></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField name={`itens.${index}.custoUnitario`} control={control} render={({ field }) => (
              <FormItem className="w-32"><FormLabel>Custo Unit. *</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(Number(e.target.value))}/></FormControl><FormMessage /></FormItem>
            )}/>
            <div className="w-32 text-right"><FormLabel>Subtotal</FormLabel><p className="font-medium h-10 flex items-center justify-end pr-2">{(useWatch({control, name: `itens.${index}.quantidade`}) * useWatch({control, name: `itens.${index}.custoUnitario`})).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p></div>
            <Button type="button" size="icon" variant="destructive" onClick={() => remove(index)}><IconTrash className="h-4 w-4" /></Button>
        </motion.div>
    );
}

export function CompraForm({ isOpen, onOpenChange, compraToEdit }: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    compraToEdit?: Compra | null;
}) {
    const { user } = useAuthStore();
    const { fornecedores, produtos, contasBancarias } = useDataStore();
    const isEditing = !!compraToEdit;

    const form = useForm<CompraFormValues>({
        resolver: zodResolver(compraSchema),
        defaultValues: isEditing
            ? { ...compraToEdit, data: new Date(compraToEdit.data) }
            : {
                data: new Date(),
                notaFiscal: "",
                fornecedorId: "",
                itens: [],
                valorTotal: 0,
                condicaoPagamento: "A_VISTA",
                contaBancariaId: "",
                numeroParcelas: 1,
                dataPrimeiroVencimento: undefined,
              },
    });

    const { fields, append, remove } = useFieldArray({ control: form.control, name: "itens" });

    const itensValues = useWatch({ control: form.control, name: 'itens' });
    useEffect(() => {
        const total = itensValues.reduce((acc: number, item: ItemCompra) => acc + (item.quantidade * item.custoUnitario || 0), 0);
        form.setValue("valorTotal", total);
    }, [itensValues, form]);

    const condicaoPagamento = form.watch("condicaoPagamento");

    const onSubmit = async (values: CompraFormValues) => {
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
            if (isEditing && compraToEdit?.id) {
                await updateCompra(compraToEdit.id, values);
                toast.success("Compra atualizada com sucesso!");
            } else {
                await addCompra(dataPayload as Omit<Compra, 'id' | 'status' | 'createdAt'>);
                toast.success("Nova compra registrada com sucesso!");
            }
            form.reset();
            onOpenChange(false);
        } catch (error: any) {
            toast.error("Falha ao salvar a compra.", { description: error.message });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader><DialogTitle>{isEditing ? "Editar Compra" : "Registrar Nova Compra"}</DialogTitle><DialogDescription>Preencha os detalhes da compra. Itens e pagamento são obrigatórios.</DialogDescription></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} id="compra-form" className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField name="data" control={form.control} render={({ field }) => (
                                <FormItem className="flex flex-col"><FormLabel>Data da Compra *</FormLabel><DatePicker date={field.value} onDateChange={field.onChange} /><FormMessage /></FormItem>
                            )}/>
                            <FormField name="fornecedorId" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Fornecedor *</FormLabel><Combobox options={fornecedores.map(f => ({ label: f.nomeRazaoSocial, value: f.id! }))} {...field} placeholder="Selecione um fornecedor" searchPlaceholder="Buscar fornecedor..." /><FormMessage /></FormItem>
                            )}/>
                            <FormField name="notaFiscal" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Nota Fiscal *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                        <Separator />
                        <div className="space-y-4">
                            <div className="flex justify-between items-center"><h3 className="text-lg font-medium">Itens da Compra</h3><Button type="button" size="sm" variant="outline" onClick={() => append({ produtoId: "", produtoNome: "", quantidade: 1, custoUnitario: 0 })}><IconPlus className="mr-2 h-4 w-4" /> Adicionar Item</Button></div>
                            <AnimatePresence>
                                {fields.map((item, index) => <ItemRow key={item.id} control={form.control} index={index} remove={remove} setValue={form.setValue} produtos={produtos} />)}
                            </AnimatePresence>
                            {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Adicione pelo menos um item à compra.</p>}
                        </div>
                        <Separator />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                            <FormField name="condicaoPagamento" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Condição de Pagamento *</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="A_VISTA">À Vista</SelectItem><SelectItem value="A_PRAZO">A Prazo</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                            )}/>
                            <AnimatePresence>
                                {condicaoPagamento === "A_PRAZO" && (
                                    <>
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><FormField name="numeroParcelas" control={form.control} render={({ field }) => (<FormItem><FormLabel>Nº de Parcelas *</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))}/></FormControl><FormMessage /></FormItem>)}/></motion.div>
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><FormField name="dataPrimeiroVencimento" control={form.control} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>1º Vencimento *</FormLabel><DatePicker date={field.value} onDateChange={field.onChange} /><FormMessage /></FormItem>)}/></motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                            <FormField name="contaBancariaId" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Conta de Origem *</FormLabel><Combobox options={contasBancarias.map(c => ({ label: c.nomeConta, value: c.id! }))} {...field} placeholder="Selecione uma conta" searchPlaceholder="Buscar conta..." /><FormMessage /></FormItem>
                            )}/>
                        </div>
                        <div className="flex justify-end pt-4"><div className="w-64 space-y-2"><div className="flex justify-between text-lg"><span className="font-semibold">Valor Total:</span><span className="font-bold">{form.watch('valorTotal').toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span></div></div></div>
                    </form>
                </Form>
                <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" form="compra-form" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Salvando..." : "Salvar Compra"}</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
