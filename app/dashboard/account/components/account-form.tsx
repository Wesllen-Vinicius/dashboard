"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { UserInfo } from "@/lib/schemas";
import { updateUserProfile } from "@/lib/services/user.services";
import { useEffect } from "react";

const accountFormSchema = z.object({
  displayName: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  email: z.string().email(),
  password: z.string().min(6, "A nova senha deve ter no mínimo 6 caracteres.").optional().or(z.literal('')),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;
type UserData = UserInfo & { email?: string | null };

interface AccountFormProps {
  currentUserData: UserData;
}

export function AccountForm({ currentUserData }: AccountFormProps) {
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: { displayName: "", email: "", password: "" },
  });
  const { formState, reset } = form;

  useEffect(() => {
    if (currentUserData) {
        reset({
            displayName: currentUserData.nome || "",
            email: currentUserData.email || "",
            password: "",
        });
    }
  }, [currentUserData, reset]);

  async function onSubmit(data: AccountFormValues) {
    const promise = updateUserProfile({
        displayName: data.displayName,
        password: data.password,
    });
    toast.promise(promise, {
        loading: 'Salvando alterações...',
        success: () => {
            form.reset({ ...data, password: '' });
            return 'Perfil atualizado com sucesso!';
        },
        error: (err) => err.message || 'Erro ao atualizar o perfil.'
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
        <FormField
          control={form.control} name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome de Exibição</FormLabel>
              <FormControl><Input placeholder="Seu nome" {...field} /></FormControl>
              <FormDescription>Este é o nome que será exibido no sistema.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control} name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input placeholder="Seu email" {...field} readOnly disabled /></FormControl>
              <FormDescription>O email de login não pode ser alterado.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control} name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nova Senha</FormLabel>
              <FormControl><Input type="password" placeholder="Deixe em branco para não alterar" {...field} /></FormControl>
              <FormDescription>Preencha este campo apenas se desejar alterar sua senha atual.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? "Salvando..." : "Salvar alterações"}
        </Button>
      </form>
    </Form>
  );
}
