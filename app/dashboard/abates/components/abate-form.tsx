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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store'; // Corrigido
import { useDataStore } from '@/store/data.store'; // Corrigido
import { useEffect } from 'react';

const formSchema = abateSchema.pick({
  data: true,
  total: true,
  condenado: true,
  responsavelId: true,
  compraId: true,
});
type AbateFormValues = z.infer<typeof formSchema>;

interface AbateFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  abateToEdit?: Abate | null;
}

export function AbateForm({ isOpen, onOpenChange, abateToEdit }: AbateFormProps) {
  const { user } = useAuthStore(); // Corrigido
  const { compras, users } = useDataStore(); // Corrigido
  const isEditMode = !!abateToEdit;

  const form = useForm<AbateFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditMode ? {
        ...abateToEdit,
        data: new Date(abateToEdit.data),
      } : {
      data: new Date(),
      total: 0,
      condenado: 0,
      responsavelId: '',
      compraId: '',
    },
  });

  useEffect(() => {
    if (isOpen && !isEditMode) {
      form.reset({
        data: new Date(),
        total: 0,
        condenado: 0,
        responsavelId: '',
        compraId: '',
      });
    } else if (isOpen && isEditMode) {
      form.reset({
        ...abateToEdit,
        data: new Date(abateToEdit.data)
      });
    }
  }, [isOpen, isEditMode, abateToEdit, form]);

  const compraOptions = compras
    .filter(c => c.status === 'ativo')
    .map(c => ({ label: `NF ${c.notaFiscal}`, value: c.id! }));

  const userOptions = users
    .filter(u => u.status === 'ativo')
    .map(u => ({ label: u.displayName, value: u.uid! }));

  const onSubmit = async (values: AbateFormValues) => {
    if (!user || !user.role) {
        toast.error("Você precisa estar autenticado para realizar esta ação.");
        return;
    }

    const userPayload = {
        uid: user.uid,
        nome: user.displayName || 'Usuário desconhecido',
        role: user.role,
    }

    const promise = isEditMode
      ? updateAbate(abateToEdit!.id!, values)
      : addAbate(values, userPayload);

    toast.promise(promise, {
      loading: `${isEditMode ? 'Atualizando' : 'Criando'} abate...`,
      success: `Abate ${isEditMode ? 'atualizado' : 'criado'} com sucesso!`,
      error: `Erro ao ${isEditMode ? 'atualizar' : 'criar'} o abate.`,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Abate' : 'Novo Abate'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Atualize os detalhes do abate.' : 'Preencha as informações para um novo abate.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data do Abate</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? (format(new Date(field.value), "PPP")) : (<span>Selecione uma data</span>)}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="compraId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compra Vinculada</FormLabel>
                  <FormControl>
                    <Combobox
                      options={compraOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecione uma compra (NF)"
                      searchPlaceholder="Buscar NF..."
                      emptyMessage="Nenhuma compra encontrada."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="responsavelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável pelo Abate</FormLabel>
                  <FormControl>
                    <Combobox
                      options={userOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecione um responsável"
                      searchPlaceholder="Buscar responsável..."
                      emptyMessage="Nenhum usuário encontrado."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="total"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total de Animais</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="condenado"
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Criar Abate')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
