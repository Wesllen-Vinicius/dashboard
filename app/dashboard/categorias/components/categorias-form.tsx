"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Categoria, categoriaSchema } from "@/lib/schemas";
import { addCategoria, updateCategoria } from "@/lib/services/categorias.services";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CategoriaFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  categoriaToEdit: Categoria | null;
}

const formSchema = categoriaSchema.pick({ nome: true });

export function CategoriaForm({
  isOpen,
  onOpenChange,
  categoriaToEdit,
}: CategoriaFormProps) {
  const isEditing = !!categoriaToEdit;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        form.reset({ nome: categoriaToEdit.nome });
      } else {
        form.reset({ nome: "" });
      }
    }
  }, [isOpen, categoriaToEdit, isEditing, form]);


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (isEditing) {
        await updateCategoria(categoriaToEdit.id!, values);
        toast.success("Categoria atualizada com sucesso!");
      } else {
        await addCategoria(values);
        toast.success("Categoria criada com sucesso!");
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao salvar categoria.", { description: error.message });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          <DialogDescription>
            Defina o nome para a categoria.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="nome" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Categoria</FormLabel>
                <FormControl><Input {...field} /></FormControl>
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
