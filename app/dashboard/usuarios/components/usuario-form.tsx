"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { SystemUser, userSchema } from "@/lib/schemas";
import { addUser, updateUser } from "@/lib/services/user.services";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UsuarioFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userToEdit: SystemUser | null;
}

const formSchema = userSchema.omit({ uid: true, status: true, dashboardLayout: true });

export function UsuarioForm({
  isOpen,
  onOpenChange,
  userToEdit,
}: UsuarioFormProps) {
  const isEditing = !!userToEdit;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: "",
      email: "",
      role: "USUARIO",
      password: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing && userToEdit) {
        form.reset({
          displayName: userToEdit.displayName,
          email: userToEdit.email,
          role: userToEdit.role,
          password: "",
        });
      } else {
        form.reset({
          displayName: "",
          email: "",
          role: "USUARIO",
          password: "",
        });
      }
    }
  }, [isOpen, userToEdit, isEditing, form]);


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (isEditing && userToEdit) {
        const { password, ...updateData } = values;
        await updateUser(userToEdit.uid, updateData);
        toast.success("Usuário atualizado com sucesso!");
      } else {
        await addUser(values as any); // O serviço já valida a senha
        toast.success("Usuário criado com sucesso!");
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao salvar usuário.", { description: error.message });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
          <DialogDescription>
            Preencha os dados do usuário do sistema.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="displayName" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome de Exibição</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" {...field} disabled={isEditing} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem>
                <FormLabel>Função</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="ADMINISTRADOR">Administrador</SelectItem>
                    <SelectItem value="USUARIO">Usuário</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}/>
            {!isEditing && (
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl><Input type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
            )}
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
