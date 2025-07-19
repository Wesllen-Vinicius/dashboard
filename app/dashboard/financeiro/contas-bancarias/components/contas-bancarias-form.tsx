"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { useAuthStore } from "@/store/auth.store";

import {
  ContaBancaria,
  ContaBancariaFormSchema,
} from "@/lib/schemas";
import {
  addContaBancaria,
  updateContaBancaria,
} from "@/lib/services/contasBancarias.services";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Banco, fetchBancos } from "@/lib/services/bancos.service";

type FormValues = z.infer<typeof ContaBancariaFormSchema>;

interface FormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  contaToEdit?: ContaBancaria | null;
}

export function ContasBancariasForm({
  isOpen,
  onOpenChange,
  contaToEdit,
}: FormProps) {
  const { user } = useAuthStore();
  const isEditing = !!contaToEdit;
  const [bancosList, setBancosList] = useState<{ label: string; value: string }[]>([]);
  const [isBancosLoading, setIsBancosLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(ContaBancariaFormSchema),
    defaultValues: {
      nomeConta: "",
      banco: "",
      agencia: "",
      conta: "",
      tipo: "Conta Corrente",
      saldoInicial: 0,
    },
  });

  useEffect(() => {
    async function loadBancos() {
      setIsBancosLoading(true);
      try {
        const bancos = await fetchBancos();
        const formattedBancos = bancos
          .filter((b): b is Banco & { code: number; name: string } => !!b.code && !!b.name)
          .map((b) => ({
            label: `${b.code} – ${b.name}`,
            value: `${b.code} – ${b.name}`,
          }));
        setBancosList(formattedBancos);
      } catch (error) {
        toast.error("Falha ao carregar a lista de bancos.");
      } finally {
        setIsBancosLoading(false);
      }
    }
    loadBancos();
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && contaToEdit) {
        form.reset({ ...contaToEdit, saldoInicial: contaToEdit.saldoInicial ?? 0 });
      } else {
        form.reset({
          nomeConta: "",
          banco: "",
          agencia: "",
          conta: "",
          tipo: "Conta Corrente",
          saldoInicial: 0,
        });
      }
    }
  }, [isOpen, contaToEdit, isEditing, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && contaToEdit?.id) {
        await updateContaBancaria(contaToEdit.id, values);
        toast.success("Conta atualizada com sucesso!");
      } else {
        if (!user) throw new Error("Usuário não encontrado para registrar a conta.");
        await addContaBancaria(values, user);
        toast.success("Nova conta adicionada!");
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Falha ao salvar a conta.", { description: error.message });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Conta" : "Adicionar Nova Conta"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da conta. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="conta-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              name="nomeConta"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Conta *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Conta Principal, Caixa da Loja" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="banco"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Banco *</FormLabel>
                   {isBancosLoading ? <Skeleton className="h-10 w-full" /> : (
                      <Combobox
                        options={bancosList}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Selecione um banco..."
                        searchPlaceholder="Pesquisar banco..."
                      />
                   )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="tipo"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Conta *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Conta Corrente">Conta Corrente</SelectItem>
                      <SelectItem value="Conta Poupança">Conta Poupança</SelectItem>
                      <SelectItem value="Caixa">Caixa</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="agencia"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agência</FormLabel>
                    <FormControl>
                      <Input placeholder="0001" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="conta"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta</FormLabel>
                    <FormControl>
                      <Input placeholder="12345-6" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                name="saldoInicial"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saldo Inicial *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0,00" {...field} onChange={e => field.onChange(e.target.valueAsNumber || 0)} disabled={isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </form>
        </Form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="conta-form" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
