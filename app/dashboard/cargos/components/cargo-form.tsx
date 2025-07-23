"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Cargo, cargoSchema } from "@/lib/schemas";
import { addCargo, updateCargo } from "@/lib/services/cargos.services";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CargoFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cargoToEdit: Cargo | null;
}

const formSchema = cargoSchema.pick({ nome: true });

export function CargoForm({
  isOpen,
  onOpenChange,
  cargoToEdit,
}: CargoFormProps) {
  const isEditing = !!cargoToEdit;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        form.reset({ nome: cargoToEdit.nome });
      } else {
        form.reset({ nome: "" });
      }
    }
  }, [isOpen, cargoToEdit, isEditing, form]);


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (isEditing) {
        await updateCargo(cargoToEdit.id!, values);
        toast.success("Cargo atualizado com sucesso!");
      } else {
        await addCargo(values);
        toast.success("Cargo criado com sucesso!");
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao salvar cargo.", { description: error.message });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Cargo" : "Novo Cargo"}</DialogTitle>
          <DialogDescription>
            Defina o nome para o cargo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="nome" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Cargo</FormLabel>
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
