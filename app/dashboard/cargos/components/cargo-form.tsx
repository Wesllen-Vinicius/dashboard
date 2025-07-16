"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { Cargo, cargoSchema } from "@/lib/schemas";
import { addCargo, updateCargo } from "@/lib/services/cargos.services";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const formSchema = cargoSchema.pick({ nome: true });
type CargoFormValues = z.infer<typeof formSchema>;

interface CargoFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cargoToEdit?: Cargo | null;
}

export function CargoForm({ isOpen, onOpenChange, cargoToEdit }: CargoFormProps) {
  const isEditing = !!cargoToEdit;

  const form = useForm<CargoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditing ? { nome: cargoToEdit.nome } : { nome: "" },
  });

  useEffect(() => {
    if (isOpen) {
        form.reset(isEditing ? { nome: cargoToEdit.nome } : { nome: "" });
    }
  }, [isOpen, cargoToEdit, isEditing, form]);

  const onSubmit = async (values: CargoFormValues) => {
    try {
      if (isEditing && cargoToEdit?.id) {
        await updateCargo(cargoToEdit.id, values);
        toast.success("Cargo atualizado com sucesso!");
      } else {
        await addCargo(values);
        toast.success("Novo cargo adicionado!");
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Falha ao salvar o cargo.", { description: error.message });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Cargo" : "Adicionar Novo Cargo"}</DialogTitle>
          <DialogDescription>
            Defina o nome do cargo. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="cargo-form" className="space-y-4 py-4">
            <FormField
              name="nome"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Cargo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Gerente de Produção" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" form="cargo-form" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
