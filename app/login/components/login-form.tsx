"use client";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion } from "framer-motion";
import { IconLoader2 } from '@tabler/icons-react';
import { loginSchema, LoginValues } from '@/lib/schemas';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import { login } from '@/lib/services/auth.services';
import PasswordResetDialog from '@/components/password-reset-dialog';

const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
    },
  }),
};

export function LoginForm() {
    const router = useRouter();
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

    const form = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    const { formState: { isSubmitting } } = form;

    const onSubmit = async (data: LoginValues) => {
        try {
            await login(data.email, data.password);
            toast.success('Login bem-sucedido!');
            router.push('/dashboard');
        } catch (error: any) {
            toast.error('Falha no login', { description: 'E-mail ou senha incorretos. Por favor, verifique e tente novamente.' });
        }
    };

    return (
        <>
            <PasswordResetDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen} />
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                <div className="flex flex-col space-y-2 text-center">
                    <motion.h1
                        className="text-2xl font-semibold tracking-tight"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        Acessar sua Conta
                    </motion.h1>
                    <motion.p
                        className="text-sm text-muted-foreground"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        Use suas credenciais para entrar no sistema.
                    </motion.p>
                </div>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                        <motion.div custom={1} initial="hidden" animate="visible" variants={formVariants}>
                          <FormField name="email" control={form.control} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl><Input placeholder="nome@exemplo.com" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}/>
                        </motion.div>
                        <motion.div custom={2} initial="hidden" animate="visible" variants={formVariants}>
                          <FormField name="password" control={form.control} render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center">
                                <FormLabel>Senha</FormLabel>
                                <button type="button" onClick={() => setIsResetDialogOpen(true)} className="ml-auto inline-block text-sm underline">
                                  Esqueceu sua senha?
                                </button>
                              </div>
                              <FormControl><Input type="password" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}/>
                        </motion.div>
                        <motion.div custom={3} initial="hidden" animate="visible" variants={formVariants}>
                          <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Entrar
                          </Button>
                        </motion.div>
                    </form>
                </Form>
            </div>
        </>
    );
}
