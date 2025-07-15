"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { useAuthStore } from "@/store/auth.store";
import { useDataStore } from "@/store/data.store";
import { Abate, abateSchema } from "@/lib/schemas";
import { addAbate, updateAbate } from "@/lib/services/abates.services";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/date-picker";

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
  onOpenChange: (open: boolean) => void;
  abateToEdit?: Abate | null;
}

export function AbateForm({ isOpen, onOpenChange, abateToEdit }: AbateFormProps) {
  const { user, role } = useAuthStore();
  const { funcionarios, compras } = useDataStore();

  const isEditing = !!abateToEdit;

  const form = useForm<AbateFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditing
      ? {
          ...abateToEdit,
          data: new Date(abateToEdit.data),
        }
      : {
          data: new Date(),
          total: 0,
          condenado: 0,
          responsavelId: "",
          compraId: "",
        },
  });

  const { formState: { isSubmitting } } = form;

  const funcionarioOptions = funcionarios.map(f => ({ label: f.nomeCompleto, value: f.id! }));
  const compraOptions = compras.map(c => ({
    label: `NF: ${c.notaFiscal} - Data: ${c.data ? new Date(c.data).toLocaleDateString('pt-BR') : 'N/A'}`,
    value: c.id!,
  }));

  const onSubmit = async (values: AbateFormValues) => {
    if (!user || !role) return toast.error("Autenticação necessária.");

    try {
      if (isEditing && abateToEdit?.id) {
        await updateAbate(abateToEdit.id, values);
        toast.success("Registro de abate atualizado!");
      } else {
        await addAbate(values, { uid: user.uid, nome: user.displayName || "Usuário", role });
        toast.success("Novo abate registrado com sucesso!");
      }
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Falha ao salvar registro.", { description: error.message });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Registro de Abate" : "Novo Registro de Abate"}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do abate. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="abate-form" className="space-y-4 py-4">
            <FormField name="compraId" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Vincular Compra de Origem *</FormLabel><Combobox options={compraOptions} {...field} placeholder="Selecione uma compra" searchPlaceholder="Buscar por NF ou data..." /><FormMessage /></FormItem>
            )}/>
            <FormField name="data" control={form.control} render={({ field }) => (
              <FormItem className="flex flex-col"><FormLabel>Data do Abate *</FormLabel><DatePicker date={field.value} onDateChange={field.onChange} /><FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-2 gap-4">
              <FormField name="total" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Total de Animais *</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField name="condenado" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Condenados</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            </div>
            <FormField name="responsavelId" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Responsável pelo Abate *</FormLabel><Combobox options={funcionarioOptions} {...field} placeholder="Selecione um responsável" searchPlaceholder="Buscar responsável..." /><FormMessage /></FormItem>
            )}/>
          </form>
        </Form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" form="abate-form" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar Registro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
