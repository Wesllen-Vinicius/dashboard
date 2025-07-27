// estoque/components/estoque-form.tsx
'use client';

import { useState, useMemo } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { IconAlertTriangle, IconLock } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Combobox } from "@/components/ui/combobox";

import { useDataStore } from "@/store/data.store";
import { useAuthStore } from "@/store/auth.store";
import { movimentacaoSchema } from "@/lib/schemas";
import { registrarMovimentacao } from "@/lib/services/estoque.services";
import z from "zod";

const formSchema = movimentacaoSchema.pick({
  produtoId: true,
  quantidade: true,
  tipo: true,
  motivo: true,
});
type MovimentacaoFormValues = z.infer<typeof formSchema>;

export function EstoqueForm() {
  const { produtos } = useDataStore();
  const { user, role } = useAuthStore();
  const [open, setOpen] = useState(false);

  const form = useForm<MovimentacaoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      produtoId: "",
      quantidade: 0,
      tipo: "entrada",
      motivo: "",
    },
  });

  const produtoOptions = useMemo(
    () =>
      produtos.map((p) => ({
        label: `${p.nome} (Estoque: ${p.quantidade ?? 0})`,
        value: p.id!,
      })),
    [produtos]
  );

  // Dependências para habilitar o form
  const dependenciasFaltantes =
    produtos.length === 0 ? [{ nome: "Produtos", link: "/dashboard/produtos" }] : [];

  // Submit do form
  const onSubmit: SubmitHandler<MovimentacaoFormValues> = async (values) => {
    if (!user) {
      toast.error("Usuário não autenticado.");
      return;
    }
    const produto = produtos.find((p) => p.id === values.produtoId);
    if (!produto) {
      toast.error("Produto selecionado inválido.");
      return;
    }
    const payload = { ...values, produtoNome: produto.nome };
    try {
      await registrarMovimentacao(payload, {
        uid: user.uid,
        nome: user.displayName || "Usuário",
      });
      toast.success("Movimentação registrada!");
      form.reset();
      setOpen(false);
    } catch (err: any) {
      toast.error("Erro ao registrar movimentação", {
        description: err.message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Ajuste Manual de Estoque</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajuste Manual de Estoque</DialogTitle>
        </DialogHeader>

        {dependenciasFaltantes.length > 0 ? (
          <Alert variant="destructive">
            <IconAlertTriangle className="h-4 w-4" />
            <AlertTitle>Pré‑requisito</AlertTitle>
            <AlertDescription>
              Cadastre primeiro:
              <ul className="list-disc pl-5 mt-2">
                {dependenciasFaltantes.map((dep) => (
                  <li key={dep.nome}>
                    <a href={dep.link} className="underline font-semibold">
                      {dep.nome}
                    </a>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form
              id="mov-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                name="produtoId"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Produto</FormLabel>
                    <Combobox options={produtoOptions} {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  name="quantidade"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="tipo"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select {...field}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="entrada">Entrada</SelectItem>
                          <SelectItem value="saida">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                name="motivo"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Quebra, ajuste..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                {role !== "ADMINISTRADOR" && (
                  <Alert variant="destructive" className="flex-1 mr-4">
                    <IconLock className="h-4 w-4" />
                    <AlertTitle>Acesso Negado</AlertTitle>
                    <AlertDescription>
                      Apenas administradores podem ajustar o estoque.
                    </AlertDescription>
                  </Alert>
                )}
                <Button
                  type="submit"
                  form="mov-form"
                  disabled={role !== "ADMINISTRADOR" || form.formState.isSubmitting}
                >
                  Registrar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
