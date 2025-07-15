"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { IconLoader2 } from "@tabler/icons-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resetPassword } from "@/lib/services/auth.services"; // Importando a função correta

const passwordResetSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
});

type PasswordResetValues = z.infer<typeof passwordResetSchema>;

interface PasswordResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PasswordResetDialog({ open, onOpenChange }: PasswordResetDialogProps) {
  const form = useForm<PasswordResetValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { email: "" },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: PasswordResetValues) => {
    try {
      await resetPassword(values.email); // Usando a função correta
      toast.success("E-mail enviado!", {
        description: "Verifique sua caixa de entrada e spam para redefinir sua senha.",
      });
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage = error.code === 'auth/user-not-found'
        ? 'Nenhum usuário encontrado com este e-mail.'
        : 'Ocorreu um erro. Tente novamente mais tarde.';
      toast.error("Falha ao enviar e-mail", { description: errorMessage });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Recuperar Senha</DialogTitle>
          <DialogDescription>
            Digite o e-mail associado à sua conta e enviaremos um link para você redefinir sua senha.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="reset-password-form">
            <motion.div
              className="grid gap-4 py-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <FormField
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input id="email" placeholder="seu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>
          </form>
        </Form>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button type="submit" form="reset-password-form" disabled={isSubmitting}>
            {isSubmitting ? <IconLoader2 className="animate-spin" /> : "Enviar E-mail"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
