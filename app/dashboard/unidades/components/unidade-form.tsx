"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Unidade, unidadeSchema } from "@/lib/schemas";
import { addUnidade, updateUnidade } from "@/lib/services/unidades.services";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface UnidadeFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  unidadeToEdit: Unidade | null;
}

const formSchema = unidadeSchema.pick({ nome: true, sigla: true });

export function UnidadeForm({
  isOpen,
  onOpenChange,
  unidadeToEdit,
}: UnidadeFormProps) {
  const isEditing = !!unidadeToEdit;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      sigla: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        form.reset({ nome: unidadeToEdit.nome, sigla: unidadeToEdit.sigla });
      } else {
        form.reset({ nome: "", sigla: "" });
      }
    }
  }, [isOpen, unidadeToEdit, isEditing, form]);


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (isEditing) {
        await updateUnidade(unidadeToEdit.id!, values);
        toast.success("Unidade atualizada com sucesso!");
      } else {
        await addUnidade(values);
        toast.success("Unidade criada com sucesso!");
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao salvar unidade.", { description: error.message });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Unidade" : "Nova Unidade"}</DialogTitle>
          <DialogDescription>
            Defina o nome e a sigla para a unidade de medida.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="nome" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Unidade</FormLabel>
                <FormControl><Input placeholder="Quilograma" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="sigla" render={({ field }) => (
              <FormItem>
                <FormLabel>Sigla</FormLabel>
                <FormControl><Input placeholder="KG" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
