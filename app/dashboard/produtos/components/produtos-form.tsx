"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Produto, produtoSchema, Unidade, Categoria } from "@/lib/schemas";
import { useData } from "@/hooks/use-data";
import { addProduto, updateProduto } from "@/lib/services/produtos.services";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type ProdutoFormValues = z.infer<typeof produtoSchema>;

export function ProdutoForm({ isOpen, onOpenChange, produtoToEdit }: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    produtoToEdit?: Produto | null;
}) {
    const { data: unidades } = useData<Unidade>('unidades');
    const { data: categorias } = useData<Categoria>('categorias');
    const isEditing = !!produtoToEdit;

    const form = useForm<ProdutoFormValues>({
        resolver: zodResolver(produtoSchema),
        defaultValues: isEditing ? produtoToEdit : {
            tipoProduto: 'VENDA',
            nome: '',
            custoUnitario: 0,
            precoVenda: 0,
            unidadeId: '',
            ncm: '',
            cfop: '',
        },
    });

    const tipoProduto = form.watch('tipoProduto');

    const onSubmit = async (values: ProdutoFormValues) => {
        try {
            if (isEditing && produtoToEdit?.id) {
                await updateProduto(produtoToEdit.id, values);
                toast.success("Produto atualizado com sucesso!");
            } else {
                await addProduto(values as Omit<Produto, 'id' | 'status' | 'createdAt' | 'quantidade'>);
                toast.success("Novo produto registrado com sucesso!");
            }
            form.reset();
            onOpenChange(false);
        } catch (error: any) {
            toast.error("Falha ao salvar o produto.", { description: error.message });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Produto" : "Novo Produto"}</DialogTitle>
                    <DialogDescription>Preencha os detalhes do produto.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} id="produto-form" className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-2">

                        <FormField
                            name="tipoProduto"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Produto *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEditing}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="VENDA">Produto para Venda</SelectItem>
                                            <SelectItem value="USO_INTERNO">Item de Uso Interno</SelectItem>
                                            <SelectItem value="MATERIA_PRIMA">Matéria-Prima</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField name="nome" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Nome / Descrição *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>

                        {tipoProduto === 'VENDA' && (
                             <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField name="precoVenda" control={form.control} render={({ field }) => (<FormItem><FormLabel>Preço de Venda *</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                    <FormField name="custoUnitario" control={form.control} render={({ field }) => (<FormItem><FormLabel>Custo Unitário</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                </div>
                                <FormField name="unidadeId" control={form.control} render={({ field }) => (<FormItem><FormLabel>Unidade de Medida *</FormLabel><Combobox options={unidades.map(u => ({ label: `${u.nome} (${u.sigla})`, value: u.id! }))} {...field} placeholder="Selecione uma unidade" /><FormMessage /></FormItem>)}/>
                                <Separator />
                                <h4 className="text-md font-medium">Informações Fiscais</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField name="ncm" control={form.control} render={({ field }) => (<FormItem><FormLabel>NCM *</FormLabel><FormControl><Input {...field} maxLength={8} /></FormControl><FormMessage /></FormItem>)}/>
                                    <FormField name="cfop" control={form.control} render={({ field }) => (<FormItem><FormLabel>CFOP *</FormLabel><FormControl><Input {...field} maxLength={4} /></FormControl><FormMessage /></FormItem>)}/>
                                    <FormField name="sku" control={form.control} render={({ field }) => (<FormItem><FormLabel>SKU (Código Interno)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                    <FormField name="cest" control={form.control} render={({ field }) => (<FormItem><FormLabel>CEST</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                </div>
                             </>
                        )}

                        {tipoProduto === 'USO_INTERNO' && (
                            <>
                                <FormField name="custoUnitario" control={form.control} render={({ field }) => (<FormItem><FormLabel>Custo Unitário *</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField name="categoriaId" control={form.control} render={({ field }) => (<FormItem><FormLabel>Categoria *</FormLabel><Combobox options={categorias.map(c => ({ label: c.nome, value: c.id! }))} {...field} placeholder="Selecione uma categoria" /><FormMessage /></FormItem>)}/>
                            </>
                        )}

                        {tipoProduto === 'MATERIA_PRIMA' && (
                             <>
                                <FormField name="custoUnitario" control={form.control} render={({ field }) => (<FormItem><FormLabel>Custo Unitário</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField name="unidadeId" control={form.control} render={({ field }) => (<FormItem><FormLabel>Unidade de Medida *</FormLabel><Combobox options={unidades.map(u => ({ label: `${u.nome} (${u.sigla})`, value: u.id! }))} {...field} placeholder="Selecione uma unidade" /><FormMessage /></FormItem>)}/>
                             </>
                        )}

                    </form>
                </Form>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit" form="produto-form" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? "Salvando..." : "Salvar Produto"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
