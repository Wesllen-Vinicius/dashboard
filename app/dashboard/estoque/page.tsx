// app/dashboard/estoque/movimentacoes/page.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { IconAlertTriangle, IconLock } from "@tabler/icons-react";
import { ColumnDef } from "@tanstack/react-table";
import { Timestamp } from "firebase/firestore";
import { motion } from "framer-motion";

import { GenericTable } from "@/components/generic-table";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

import { useDataStore } from "@/store/data.store";
import { useAuthStore } from "@/store/auth.store";
import { movimentacaoSchema, Movimentacao } from "@/lib/schemas";
import { registrarMovimentacao } from "@/lib/services/estoque.services";

import { EstoqueStatsCards } from "./components/estoque-stats-cards";

import z from "zod";

// --- Form Schema ---
const formSchema = movimentacaoSchema.pick({
  produtoId: true,
  quantidade: true,
  tipo: true,
  motivo: true,
});
type MovimentacaoFormValues = z.infer<typeof formSchema>;

// Enriquecido para exibição
type MovimentacaoEnriquecida = Movimentacao & {
  produtoNome: string;
  dataFormatada: string;
  registradoPorNome: string | null;
};

export default function MovimentacoesEstoquePage() {
  const { produtos, movimentacoes } = useDataStore();
  const { user, role } = useAuthStore();

  const [searchTerm, setSearchTerm] = useState("");

  // Hook form
  const form = useForm<MovimentacaoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      produtoId: "",
      quantidade: 0,
      tipo: "entrada",
      motivo: "",
    },
  });

  // Opções de produtos
  const produtoOptions = useMemo(
    () =>
      produtos.map((p) => ({
        label: `${p.nome} (Estoque: ${p.quantidade || 0})`,
        value: p.id!,
      })),
    [produtos]
  );

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

    // Service espera campo produtoNome
    const payload = {
      ...values,
      produtoNome: produto.nome,
    };

    try {
      await registrarMovimentacao(payload, {
        uid: user.uid,
        nome: user.displayName || "Usuário",
      });
      toast.success("Movimentação registrada com sucesso!");
      form.reset();
    } catch (err: any) {
      toast.error("Erro ao registrar movimentação", {
        description: err.message,
      });
    }
  };

  // Enriquecer e filtrar movimentações
  const movimentacoesEnriquecidas = useMemo<MovimentacaoEnriquecida[]>(
    () => {
      const lowerFilter = searchTerm.toLowerCase();
      return movimentacoes
        .map((mov) => {
          const prod = produtos.find((p) => p.id === mov.produtoId);
          // Tratamento de data:
          let dateStr = "–";
          if (mov.data) {
            if (mov.data instanceof Timestamp) {
              dateStr = format(mov.data.toDate(), "dd/MM/yyyy HH:mm");
            } else if (mov.data instanceof Date) {
              dateStr = format(mov.data, "dd/MM/yyyy HH:mm");
            }
          }
          return {
            ...mov,
            produtoNome: prod?.nome || "–",
            dataFormatada: dateStr,
            registradoPorNome: mov.registradoPor?.nome || "Sistema",
          };
        })
        .filter((m) => m.produtoNome.toLowerCase().includes(lowerFilter));
    },
    [movimentacoes, produtos, searchTerm]
  );

  // Dependências para habilitar o form
  const dependenciasFaltantes =
    produtos.length === 0 ? [{ nome: "Produtos", link: "/dashboard/produtos" }] : [];

  // Colunas da tabela
  const columns: ColumnDef<MovimentacaoEnriquecida>[] = [
    { accessorKey: "dataFormatada", header: "Data" },
    { accessorKey: "produtoNome", header: "Produto" },
    {
      accessorKey: "quantidade",
      header: "Qtd",
      cell: ({ row }) => <div className="text-center">{row.original.quantidade}</div>,
    },
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => {
        const isEntrada = row.original.tipo === "entrada";
        return (
          <Badge variant={isEntrada ? "success" : "destructive"}>
            {isEntrada ? "Entrada" : "Saída"}
          </Badge>
        );
      },
    },
    { accessorKey: "motivo", header: "Motivo" },
    { accessorKey: "registradoPorNome", header: "Quem" },
  ];

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 1) Estatísticas Gerais */}
      <EstoqueStatsCards />

      {/* 2) Ajuste Manual */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Ajuste Manual de Estoque</CardTitle>
              <CardDescription>
                Entradas e saídas manuais. Apenas administradores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dependenciasFaltantes.length > 0 ? (
                <Alert variant="destructive">
                  <IconAlertTriangle className="h-4 w-4" />
                  <AlertTitle>Pré‑requisito</AlertTitle>
                  <AlertDescription>
                    Cadastre primeiro:
                    <ul className="list-disc pl-5 mt-2">
                      {dependenciasFaltantes.map((dep) => (
                        <li key={dep.nome}>
                          <Link href={dep.link} className="underline font-semibold">
                            {dep.nome}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : (
                <Form {...form}>
                  <fieldset disabled={role !== "ADMINISTRADOR"} className="space-y-4 disabled:opacity-50">
                    <form id="mov-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField name="produtoId" control={form.control} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Produto</FormLabel>
                          <Combobox options={produtoOptions} {...field} />
                          <FormMessage />
                        </FormItem>
                      )} />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField name="quantidade" control={form.control} render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantidade</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField name="tipo" control={form.control} render={({ field }) => (
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
                        )} />
                      </div>

                      <FormField name="motivo" control={form.control} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motivo</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Quebra, ajuste..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <div className="text-right">
                        <Button type="submit" form="mov-form">Registrar</Button>
                      </div>
                    </form>
                  </fieldset>
                  {role !== "ADMINISTRADOR" && (
                    <Alert variant="destructive" className="mt-4">
                      <IconLock className="h-4 w-4" />
                      <AlertTitle>Acesso Negado</AlertTitle>
                      <AlertDescription>
                        Apenas administradores podem ajustar o estoque.
                      </AlertDescription>
                    </Alert>
                  )}
                </Form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 3) Histórico de Movimentações */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Histórico de Movimentações</CardTitle>
              <Input
                placeholder="Filtrar por produto…"
                className="max-w-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </CardHeader>
            <CardContent>
              <GenericTable columns={columns} data={movimentacoesEnriquecidas} />
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
