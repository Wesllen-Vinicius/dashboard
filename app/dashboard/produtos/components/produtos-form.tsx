"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useDataStore } from "@/store/data.store";
import { Produto, produtoSchema, ProdutoVenda, ProdutoMateriaPrima, ProdutoUsoInterno } from "@/lib/schemas";
import { addProduto, updateProduto } from "@/lib/services/produtos.services";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch"; // Importado
import { Separator } from "@/components/ui/separator"; // Importado

interface FormProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    produtoToEdit?: Produto | null;
}

const formSchema = z.object({
    tipoProduto: z.enum(["VENDA", "USO_INTERNO", "MATERIA_PRIMA"]),
    nome: z.string().min(3, "O nome/descrição é obrigatório."),
    custoUnitario: z.coerce.number().min(0, "O custo não pode ser negativo."),
    metaPorAnimal: z.coerce.number().min(0, "A meta não pode ser negativa.").optional(),
    unidadeId: z.string().optional(),
    precoVenda: z.coerce.number().optional(),
    sku: z.string().optional(),
    ncm: z.string().optional(),
    cfop: z.string().optional(),
    cest: z.string().optional(),
    categoriaId: z.string().optional(),
    // Novos campos adicionados
    controlaLote: z.boolean().default(false).optional(),
    diasValidade: z.coerce.number().min(0, "Os dias devem ser 0 ou mais.").optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ProdutoForm({
    isOpen,
    onOpenChange,
    produtoToEdit,
}: FormProps) {
    const isEditing = !!produtoToEdit;
    const [currentStep, setCurrentStep] = useState(0);
    const { unidades, categorias } = useDataStore();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        mode: 'onChange',
    });

    const tipoProduto = form.watch("tipoProduto");
    const controlaLote = form.watch("controlaLote");

    useEffect(() => {
        if (isOpen) {
            setCurrentStep(0);
            if (isEditing && produtoToEdit) {
                form.reset({
                    tipoProduto: produtoToEdit.tipoProduto,
                    nome: produtoToEdit.nome || "",
                    custoUnitario: produtoToEdit.custoUnitario || 0,
                    // Garante que as propriedades existem antes de acessá-las
                    ...(produtoToEdit.tipoProduto === 'VENDA' && {
                        metaPorAnimal: produtoToEdit.metaPorAnimal || 0,
                        unidadeId: produtoToEdit.unidadeId,
                        precoVenda: produtoToEdit.precoVenda || 0,
                        sku: produtoToEdit.sku,
                        ncm: produtoToEdit.ncm,
                        cfop: produtoToEdit.cfop,
                        cest: produtoToEdit.cest,
                        controlaLote: produtoToEdit.controlaLote,
                        diasValidade: produtoToEdit.diasValidade,
                    }),
                    ...(produtoToEdit.tipoProduto === 'USO_INTERNO' && {
                        categoriaId: produtoToEdit.categoriaId,
                    }),
                    ...(produtoToEdit.tipoProduto === 'MATERIA_PRIMA' && {
                        metaPorAnimal: produtoToEdit.metaPorAnimal || 0,
                        unidadeId: produtoToEdit.unidadeId,
                    })
                });
            } else {
                form.reset({
                    tipoProduto: "VENDA",
                    nome: "",
                    custoUnitario: 0,
                    metaPorAnimal: 0,
                    unidadeId: "",
                    precoVenda: 0,
                    sku: "",
                    ncm: "",
                    cfop: "",
                    cest: "",
                    categoriaId: "",
                    controlaLote: false,
                    diasValidade: 0,
                });
            }
        }
    }, [isOpen, produtoToEdit, isEditing, form]);

    const steps = [
        { id: 1, name: "Tipo de Produto", fields: ["tipoProduto"] },
        { id: 2, name: "Detalhes do Produto", fields: ["nome", "custoUnitario", "unidadeId", "precoVenda", "categoriaId", "metaPorAnimal", "controlaLote", "diasValidade"] },
        { id: 3, name: "Informações Fiscais", fields: ["ncm", "cfop"] }
    ];

    const activeSteps = tipoProduto === 'VENDA' ? steps : steps.slice(0, 2);

    const nextStep = async () => {
        const fieldsToValidate = activeSteps[currentStep].fields as (keyof FormValues)[];
        const output = await form.trigger(fieldsToValidate, { shouldFocus: true });

        if (output && currentStep < activeSteps.length - 1) {
            setCurrentStep(step => step + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) setCurrentStep(step => step - 1);
    };

    const onSubmit = async (values: FormValues) => {
        try {
            let dataToSubmit: Omit<Produto, "id" | "status" | "createdAt" | "quantidade">;

            switch (values.tipoProduto) {
                case 'VENDA':
                    dataToSubmit = {
                        tipoProduto: 'VENDA',
                        nome: values.nome,
                        custoUnitario: values.custoUnitario,
                        metaPorAnimal: values.metaPorAnimal,
                        unidadeId: values.unidadeId!,
                        precoVenda: values.precoVenda!,
                        ncm: values.ncm!,
                        cfop: values.cfop!,
                        sku: values.sku || "",
                        cest: values.cest || "",
                        // Novos campos
                        controlaLote: values.controlaLote,
                        diasValidade: values.diasValidade,
                    } as Omit<ProdutoVenda, "id" | "status" | "createdAt" | "quantidade">;
                    break;
                case 'USO_INTERNO':
                    dataToSubmit = {
                        tipoProduto: 'USO_INTERNO',
                        nome: values.nome,
                        custoUnitario: values.custoUnitario,
                        categoriaId: values.categoriaId!,
                    } as Omit<ProdutoUsoInterno, "id" | "status" | "createdAt" | "quantidade">;
                    break;
                case 'MATERIA_PRIMA':
                    dataToSubmit = {
                        tipoProduto: 'MATERIA_PRIMA',
                        nome: values.nome,
                        custoUnitario: values.custoUnitario,
                        metaPorAnimal: values.metaPorAnimal,
                        unidadeId: values.unidadeId!,
                    } as Omit<ProdutoMateriaPrima, "id" | "status" | "createdAt" | "quantidade">;
                    break;
                default:
                    throw new Error("Tipo de produto inválido");
            }

            const finalData = produtoSchema.parse(dataToSubmit);

            if (isEditing && produtoToEdit?.id) {
                await updateProduto(produtoToEdit.id, finalData);
                toast.success("Produto atualizado com sucesso!");
            } else {
                await addProduto(finalData as any);
                toast.success("Novo produto adicionado!");
            }
            onOpenChange(false);
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                toast.error("Erro de validação.", { description: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(' | ') });
            } else {
                toast.error("Falha ao salvar o produto.", { description: error.message });
            }
        }
    };

    const progress = ((currentStep + 1) / activeSteps.length) * 100;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Produto" : "Novo Produto"}</DialogTitle>
                </DialogHeader>
                <Progress value={progress} className="w-full h-2 mt-2" />
                <Form {...form}>
                    <form id="produto-form" onSubmit={form.handleSubmit(onSubmit)} className="py-4 min-h-[380px]">
                        <AnimatePresence mode="wait">
                            <motion.div key={currentStep} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }} transition={{ duration: 0.3 }}>
                                {currentStep === 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">{activeSteps[0].name}</h3>
                                        <FormField name="tipoProduto" control={form.control} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Selecione o tipo do produto</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value} disabled={isEditing}>
                                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="VENDA">Produto para Venda</SelectItem>
                                                        <SelectItem value="USO_INTERNO">Uso Interno / Consumo</SelectItem>
                                                        <SelectItem value="MATERIA_PRIMA">Matéria-Prima</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )} />
                                    </div>
                                )}
                                {currentStep === 1 && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">{activeSteps[1].name}</h3>
                                        <FormField name="nome" control={form.control} render={({ field }) => (<FormItem><FormLabel>Nome / Descrição</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                        {(tipoProduto === 'VENDA' || tipoProduto === 'MATERIA_PRIMA') && <FormField name="unidadeId" control={form.control} render={({ field }) => (<FormItem><FormLabel>Unidade</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent>{unidades.map(u => <SelectItem key={u.id} value={u.id!}>{u.nome} ({u.sigla})</SelectItem>)}</SelectContent></Select></FormItem>)} />}
                                        {tipoProduto === 'USO_INTERNO' && <FormField name="categoriaId" control={form.control} render={({ field }) => (<FormItem><FormLabel>Categoria</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent>{categorias.map(c => <SelectItem key={c.id} value={c.id!}>{c.nome}</SelectItem>)}</SelectContent></Select></FormItem>)} />}
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField name="custoUnitario" control={form.control} render={({ field }) => (<FormItem><FormLabel>Custo Unitário</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>)} />
                                            {tipoProduto === 'VENDA' && <FormField name="precoVenda" control={form.control} render={({ field }) => (<FormItem><FormLabel>Preço de Venda</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>)} />}
                                        </div>
                                        {/* SEÇÃO DE CONTROLE DE LOTE */}
                                        {tipoProduto === 'VENDA' && (
                                            <>
                                                <Separator className="my-6" />
                                                <div className="space-y-4 p-4 border rounded-md bg-muted/50">
                                                    <FormField
                                                        control={form.control}
                                                        name="controlaLote"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center justify-between">
                                                                <FormLabel>Controlar Lote e Validade?</FormLabel>
                                                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                    {controlaLote && (
                                                        <FormField
                                                            control={form.control}
                                                            name="diasValidade"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Dias para Validade</FormLabel>
                                                                    <FormControl><Input type="number" placeholder="Ex: 30" {...field} value={field.value ?? 0} /></FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                                {currentStep === 2 && tipoProduto === 'VENDA' && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">{activeSteps[2].name}</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField name="ncm" control={form.control} render={({ field }) => (<FormItem><FormLabel>NCM</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                            <FormField name="cfop" control={form.control} render={({ field }) => (<FormItem><FormLabel>CFOP</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField name="sku" control={form.control} render={({ field }) => (<FormItem><FormLabel>SKU (Opcional)</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                            <FormField name="cest" control={form.control} render={({ field }) => (<FormItem><FormLabel>CEST (Opcional)</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </form>
                </Form>
                <DialogFooter className="mt-6 pt-4 border-t">
                    <div className="flex justify-between w-full">
                        <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 0}><IconArrowLeft className="h-4 w-4 mr-2" />Voltar</Button>
                        {currentStep < activeSteps.length - 1 && (<Button type="button" onClick={nextStep}>Avançar<IconArrowRight className="h-4 w-4 ml-2" /></Button>)}
                        {currentStep === activeSteps.length - 1 && (<Button type="submit" form="produto-form" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Salvando..." : (isEditing ? "Salvar Alterações" : "Finalizar")}</Button>)}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
