"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { Unidade, unidadeSchema } from "@/lib/schemas";
import { addUnidade, updateUnidade } from "@/lib/services/unidades.services";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = unidadeSchema.pick({ nome: true, sigla: true });
type UnidadeFormValues = z.infer<typeof formSchema>;

interface UnidadeFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  unidadeToEdit?: Unidade | null;
}

export function UnidadeForm({ isOpen, onOpenChange, unidadeToEdit }: UnidadeFormProps) {
  const isEditing = !!unidadeToEdit;

  const form = useForm<UnidadeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { nome: "", sigla: "" },
  });

  useEffect(() => {
    if (isOpen) {
        form.reset(isEditing ? { nome: unidadeToEdit.nome, sigla: unidadeToEdit.sigla } : { nome: "", sigla: "" });
    }
  }, [isOpen, unidadeToEdit, isEditing, form]);

  const onSubmit = async (values: UnidadeFormValues) => {
    try {
      if (isEditing && unidadeToEdit?.id) {
        await updateUnidade(unidadeToEdit.id, values);
        toast.success("Unidade atualizada com sucesso!");
      } else {
        await addUnidade(values);
        toast.success("Nova unidade adicionada!");
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Falha ao salvar a unidade.", { description: error.message });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Unidade" : "Adicionar Nova Unidade"}</DialogTitle>
          <DialogDescription>
            Defina o nome e a sigla da unidade de medida.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="unidade-form" className="space-y-4 py-4">
            <FormField name="nome" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Nome da Unidade *</FormLabel><FormControl><Input placeholder="Ex: Quilograma, Pacote" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField name="sigla" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Sigla *</FormLabel><FormControl><Input placeholder="Ex: kg, pct" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
          </form>
        </Form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" form="unidade-form" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
