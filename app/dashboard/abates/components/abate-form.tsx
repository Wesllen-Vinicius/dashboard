'use client';

import { useForm, useWatch, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { DatePicker } from '@/components/date-picker';
import { Progress } from '@/components/ui/progress';

import { Abate } from '@/lib/schemas';
import { addAbate, updateAbate } from '@/lib/services/abates.services';
import { formatCurrency } from '@/lib/utils/formatters';
import { useAuthStore } from '@/store/auth.store';
import { useDataStore } from '@/store/data.store';

// 1) Schema dedicado ao formulário (todos os campos obrigatórios e sem default)
const formSchema = z.object({
  data: z.date({ required_error: 'A data é obrigatória.' }),
  fornecedorId: z.string().min(1, 'Selecione um fornecedor.'),
  numeroAnimais: z.coerce
    .number({ invalid_type_error: 'Inválido' })
    .positive('O número de animais deve ser maior que zero.'),
  custoPorAnimal: z.coerce
    .number({ invalid_type_error: 'Inválido' })
    .positive('O custo por animal deve ser positivo.'),
  condenado: z.coerce
    .number({ invalid_type_error: 'Inválido' })
    .min(0, 'A quantidade de condenados não pode ser negativa.'),
});
type AbateFormValues = z.infer<typeof formSchema>;

const steps = [
  { id: 1, name: 'Dados do Lote', fields: ['data', 'fornecedorId'] },
  {
    id: 2,
    name: 'Quantidades e Custos',
    fields: ['numeroAnimais', 'custoPorAnimal', 'condenado'],
  },
];

interface AbateFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  abateToEdit?: Abate | null;
}

export function AbateForm({
  isOpen,
  onOpenChange,
  abateToEdit,
}: AbateFormProps) {
  const { user } = useAuthStore();
  const { fornecedores } = useDataStore();
  const isEditMode = Boolean(abateToEdit);

  // 2) useForm com nosso formSchema sem disputa de optional/default
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

  const [currentStep, setCurrentStep] = useState(0);

  // 3) cálculo dinâmico de custoTotal
  const numeroAnimais = useWatch({ control: form.control, name: 'numeroAnimais' });
  const custoPorAnimal = useWatch({ control: form.control, name: 'custoPorAnimal' });
  const custoTotal = useMemo(() => numeroAnimais * custoPorAnimal, [
    numeroAnimais,
    custoPorAnimal,
  ]);

  // 4) popula ou reseta o form ao abrir o diálogo
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
    const valid = await form.trigger(fields, { shouldFocus: true });
    if (valid && currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  };
  const prevStep = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const fornecedorOptions = fornecedores
    .filter((f) => f.status === 'ativo')
    .map((f) => ({ label: f.nomeRazaoSocial, value: f.id! }));

  // 5) onSubmit tipado corretamente como SubmitHandler<AbateFormValues>
  const onSubmit: SubmitHandler<AbateFormValues> = async (values) => {
    if (!user) {
      toast.error('Você precisa estar autenticado.');
      return;
    }
    const payload = {
      ...values,
      custoTotal,
      registradoPor: { uid: user.uid, nome: user.displayName || 'Usuário' },
    };

    const promise = isEditMode
      ? updateAbate(abateToEdit!.id!, payload)
      : addAbate(payload, { uid: user.uid, nome: user.displayName! });

    toast.promise(promise, {
      loading: isEditMode ? 'Atualizando abate...' : 'Lançando abate...',
      success: isEditMode ? 'Abate atualizado!' : 'Abate lançado!',
      error: (err) => `Erro: ${err.message}`,
    });

    onOpenChange(false);
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar Abate' : 'Registrar Abate'}
          </DialogTitle>
          <DialogDescription>
            Preencha os passos para continuar.
          </DialogDescription>
        </DialogHeader>

        <Progress value={progress} className="w-full h-2 mb-4" />

        <Form {...form}>
          <form
            id="abate-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -30, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">{steps[0].name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        name="data"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data do Abate</FormLabel>
                            <FormControl>
                              <DatePicker
                                date={field.value}
                                onDateChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name="fornecedorId"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frigorífico</FormLabel>
                            <FormControl>
                              <Combobox
                                options={fornecedorOptions}
                                {...field}
                                placeholder="Selecione"
                                searchPlaceholder="Buscar..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">{steps[1].name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        name="numeroAnimais"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Animais Abatidos</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name="custoPorAnimal"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Custo / Animal (R$)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name="condenado"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Animais Condenados</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="pt-2">
                      <span className="text-sm font-medium">
                        Custo Total: {formatCurrency(custoTotal)}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </form>
        </Form>

        <DialogFooter className="pt-4">
          <div className="flex justify-between w-full">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button onClick={nextStep}>
                Avançar
                <IconArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                form="abate-form"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? 'Salvando...'
                  : isEditMode
                  ? 'Salvar Alterações'
                  : 'Lançar Abate'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
