'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { addAbate, updateAbate } from '@/lib/services/abates.services';
import { Abate, abateSchema } from '@/lib/schemas';
import { toast } from 'sonner';
import { Combobox } from '@/components/ui/combobox';
import { DatePicker } from '@/components/date-picker';
import { useAuthStore } from '@/store/auth.store';
import { useDataStore } from '@/store/data.store';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { Progress } from '@/components/ui/progress';

const formSchema = abateSchema.pick({
  data: true,
  fornecedorId: true,
  numeroAnimais: true,
  custoPorAnimal: true,
  condenado: true,
});
type AbateFormValues = z.infer<typeof formSchema>;

const steps = [
  { id: 1, name: "Dados do Lote", fields: ["data", "fornecedorId"] },
  { id: 2, name: "Quantidades e Custos", fields: ["numeroAnimais", "custoPorAnimal", "condenado"] },
];

interface AbateFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  abateToEdit?: Abate | null;
}

export function AbateForm({ isOpen, onOpenChange, abateToEdit }: AbateFormProps) {
  const { user } = useAuthStore();
  const { fornecedores } = useDataStore();
  const isEditMode = !!abateToEdit;
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<AbateFormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
        data: new Date(),
        fornecedorId: '',
        numeroAnimais: 0,
        custoPorAnimal: 0,
        condenado: 0,
    },
  });

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      if (isEditMode && abateToEdit) {
          form.reset({
              data: new Date(abateToEdit.data),
              fornecedorId: abateToEdit.fornecedorId,
              numeroAnimais: abateToEdit.numeroAnimais,
              custoPorAnimal: abateToEdit.custoPorAnimal,
              condenado: abateToEdit.condenado || 0,
          });
      } else {
          form.reset({
              data: new Date(),
              fornecedorId: '',
              numeroAnimais: 0,
              custoPorAnimal: 0,
              condenado: 0,
          });
      }
    }
  }, [isOpen, isEditMode, abateToEdit, form]);

  const nextStep = async () => {
    const fields = steps[currentStep].fields as (keyof AbateFormValues)[];
    const output = await form.trigger(fields, { shouldFocus: true });

    if (output && currentStep < steps.length - 1) {
      setCurrentStep(step => step + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(step => step - 1);
  };

  const fornecedorOptions = fornecedores
    .filter(f => f.status === 'ativo')
    .map(f => ({ label: f.nomeRazaoSocial, value: f.id! }));

  const onSubmit = async (values: AbateFormValues) => {
    if (!user) {
        toast.error("Você precisa estar autenticado para realizar esta ação.");
        return;
    }

    const userPayload = {
        uid: user.uid,
        nome: user.displayName || 'Usuário desconhecido',
    };

    const promise = isEditMode
        ? updateAbate(abateToEdit!.id!, values)
        : addAbate(values, userPayload);

    toast.promise(promise, {
        loading: `${isEditMode ? 'Atualizando' : 'Lançando'} abate...`,
        success: `Abate ${isEditMode ? 'atualizado' : 'lançado'} com sucesso!`,
        error: (err) => `Erro: ${err.message}`,
    });

    onOpenChange(false);
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Lançamento' : 'Lançamento de Abate'}</DialogTitle>
          <DialogDescription>Siga os passos para iniciar o processo de produção.</DialogDescription>
        </DialogHeader>
        <Progress value={progress} className="w-full h-2 mt-2" />
        <Form {...form}>
          <form id="abate-form" onSubmit={form.handleSubmit(onSubmit)} className="py-4 min-h-[280px]">
            <AnimatePresence mode="wait">
              <motion.div key={currentStep} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }} transition={{ duration: 0.3 }}>
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">{steps[0].name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField name="data" control={form.control} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Data do Abate</FormLabel><DatePicker date={field.value} onDateChange={field.onChange} /><FormMessage /></FormItem>)}/>
                      <FormField name="fornecedorId" control={form.control} render={({ field }) => (<FormItem><FormLabel>Fornecedor (Frigorífico)</FormLabel><Combobox options={fornecedorOptions} value={field.value} onChange={field.onChange} placeholder="Selecione o fornecedor" searchPlaceholder="Buscar fornecedor..." emptyMessage="Nenhum fornecedor encontrado."/><FormMessage /></FormItem>)}/>
                    </div>
                  </div>
                )}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">{steps[1].name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField name="numeroAnimais" control={form.control} render={({ field }) => (<FormItem><FormLabel>Nº de Animais Abatidos</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField name="custoPorAnimal" control={form.control} render={({ field }) => (<FormItem><FormLabel>Custo por Animal (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField name="condenado" control={form.control} render={({ field }) => (<FormItem><FormLabel>Animais Condenados</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
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
            {currentStep < steps.length - 1 && (<Button type="button" onClick={nextStep}>Avançar<IconArrowRight className="h-4 w-4 ml-2"/></Button>)}
            {currentStep === steps.length - 1 && (<Button type="submit" form="abate-form" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Lançar Abate')}</Button>)}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
