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

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      if (isEditing && produtoToEdit) {
        form.reset({
          tipoProduto: produtoToEdit.tipoProduto,
          nome: produtoToEdit.nome || "",
          custoUnitario: produtoToEdit.custoUnitario || 0,
          metaPorAnimal: 'metaPorAnimal' in produtoToEdit ? produtoToEdit.metaPorAnimal || 0 : 0,
          unidadeId: 'unidadeId' in produtoToEdit ? produtoToEdit.unidadeId : "",
          precoVenda: 'precoVenda' in produtoToEdit ? produtoToEdit.precoVenda || 0 : 0,
          sku: 'sku' in produtoToEdit ? produtoToEdit.sku : "",
          ncm: 'ncm' in produtoToEdit ? produtoToEdit.ncm : "",
          cfop: 'cfop' in produtoToEdit ? produtoToEdit.cfop : "",
          cest: 'cest' in produtoToEdit ? produtoToEdit.cest : "",
          categoriaId: 'categoriaId' in produtoToEdit ? produtoToEdit.categoriaId : "",
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
        });
      }
    }
  }, [isOpen, produtoToEdit, isEditing, form]);

  const steps = [
    { id: 1, name: "Tipo de Produto", fields: ["tipoProduto"]},
    { id: 2, name: "Detalhes do Produto", fields: ["nome", "custoUnitario", "unidadeId", "precoVenda", "categoriaId", "metaPorAnimal"]},
    { id: 3, name: "Informações Fiscais", fields: ["ncm", "cfop"]}
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

      produtoSchema.parse(dataToSubmit);

      if (isEditing && produtoToEdit?.id) {
        await updateProduto(produtoToEdit.id, dataToSubmit);
        toast.success("Produto atualizado com sucesso!");
      } else {
        await addProduto(dataToSubmit as any);
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
          <DialogDescription>Siga os passos para cadastrar o produto.</DialogDescription>
        </DialogHeader>
        <Progress value={progress} className="w-full h-2 mt-2" />
        <Form {...form}>
          <form id="produto-form" onSubmit={form.handleSubmit(onSubmit)} className="py-4 min-h-[380px]">
            <AnimatePresence mode="wait">
              <motion.div key={currentStep} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }} transition={{ duration: 0.3 }}>
                {currentStep === 0 && (
                  <div className="space-y-4"><h3 className="text-lg font-semibold">{activeSteps[0].name}</h3>
                    <FormField name="tipoProduto" control={form.control} render={({ field }) => (<FormItem><FormLabel>Selecione o tipo do produto</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isEditing}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="VENDA">Produto para Venda</SelectItem><SelectItem value="USO_INTERNO">Uso Interno / Consumo</SelectItem><SelectItem value="MATERIA_PRIMA">Matéria-Prima</SelectItem></SelectContent></Select><FormMessage/></FormItem>)}/>
                  </div>
                )}
                {currentStep === 1 && (
                  <div className="space-y-4"><h3 className="text-lg font-semibold">{activeSteps[1].name}</h3>
                    <FormField name="nome" control={form.control} render={({ field }) => (<FormItem><FormLabel>Nome / Descrição</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>)}/>
                    { (tipoProduto === 'VENDA' || tipoProduto === 'MATERIA_PRIMA') && <FormField name="unidadeId" control={form.control} render={({ field }) => (<FormItem><FormLabel>Unidade de Medida</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger></FormControl><SelectContent>{unidades.map(u => <SelectItem key={u.id} value={u.id!}>{u.nome} ({u.sigla})</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>)}/> }
                    { tipoProduto === 'USO_INTERNO' && <FormField name="categoriaId" control={form.control} render={({ field }) => (<FormItem><FormLabel>Categoria</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger></FormControl><SelectContent>{categorias.map(c => <SelectItem key={c.id} value={c.id!}>{c.nome}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>)}/> }
                    <div className="grid grid-cols-2 gap-4">
                      <FormField name="custoUnitario" control={form.control} render={({ field }) => (<FormItem><FormLabel>Custo Unitário</FormLabel><FormControl><Input type="number" step="0.01" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                      { tipoProduto === 'VENDA' && <FormField name="precoVenda" control={form.control} render={({ field }) => (<FormItem><FormLabel>Preço de Venda</FormLabel><FormControl><Input type="number" step="0.01" {...field}/></FormControl><FormMessage/></FormItem>)}/> }
                    </div>
                     { (tipoProduto === 'VENDA' || tipoProduto === 'MATERIA_PRIMA') && (
                        <FormField name="metaPorAnimal" control={form.control} render={({ field }) => (<FormItem><FormLabel>Meta por Animal (Opcional)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? 0} /></FormControl><FormMessage/></FormItem>)}/>
                     )}
                  </div>
                )}
                 {currentStep === 2 && tipoProduto === 'VENDA' && (
                  <div className="space-y-4"><h3 className="text-lg font-semibold">{activeSteps[2].name}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField name="ncm" control={form.control} render={({ field }) => (<FormItem><FormLabel>NCM</FormLabel><FormControl><Input {...field} value={field.value ?? ''}/></FormControl><FormMessage/></FormItem>)}/>
                      <FormField name="cfop" control={form.control} render={({ field }) => (<FormItem><FormLabel>CFOP</FormLabel><FormControl><Input {...field} value={field.value ?? ''}/></FormControl><FormMessage/></FormItem>)}/>
                    </div>
                      <div className="grid grid-cols-2 gap-4">
                      <FormField name="sku" control={form.control} render={({ field }) => (<FormItem><FormLabel>SKU (Opcional)</FormLabel><FormControl><Input {...field} value={field.value ?? ''}/></FormControl><FormMessage/></FormItem>)}/>
                      <FormField name="cest" control={form.control} render={({ field }) => (<FormItem><FormLabel>CEST (Opcional)</FormLabel><FormControl><Input {...field} value={field.value ?? ''}/></FormControl><FormMessage/></FormItem>)}/>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </form>
        </Form>
        <DialogFooter className="mt-6 pt-4 border-t">
          <div className="flex justify-between w-full">
            <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 0}><IconArrowLeft className="h-4 w-4 mr-2"/>Voltar</Button>
            {currentStep < activeSteps.length - 1 && (<Button type="button" onClick={nextStep}>Avançar<IconArrowRight className="h-4 w-4 ml-2"/></Button>)}
            {currentStep === activeSteps.length - 1 && (<Button type="submit" form="produto-form" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Salvando..." : (isEditing ? "Salvar Alterações" : "Finalizar")}</Button>)}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
