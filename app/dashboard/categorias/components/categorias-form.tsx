"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { Categoria, categoriaSchema } from "@/lib/schemas";
import { addCategoria, updateCategoria } from "@/lib/services/categorias.services";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = categoriaSchema.pick({ nome: true });
type CategoriaFormValues = z.infer<typeof formSchema>;

interface CategoriaFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  categoriaToEdit?: Categoria | null;
}

export function CategoriaForm({
  isOpen,
  onOpenChange,
  categoriaToEdit,
}: CategoriaFormProps) {
  const isEditing = !!categoriaToEdit;

  const form = useForm<CategoriaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { nome: "" },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(isEditing ? { nome: categoriaToEdit.nome } : { nome: "" });
    }
  }, [isOpen, categoriaToEdit, isEditing, form]);

  const onSubmit = async (values: CategoriaFormValues) => {
    try {
      if (isEditing && categoriaToEdit?.id) {
        await updateCategoria(categoriaToEdit.id, values);
        toast.success("Categoria atualizada com sucesso!");
      } else {
        await addCategoria(values);
        toast.success("Nova categoria adicionada!");
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Falha ao salvar a categoria.", {
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Categoria" : "Adicionar Nova Categoria"}
          </DialogTitle>
          <DialogDescription>
            Defina o nome da categoria. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            id="categoria-form"
            className="space-y-4 py-4"
          >
            <FormField
              name="nome"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Categoria *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Higiene, Cortes Bovinos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="categoria-form"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
