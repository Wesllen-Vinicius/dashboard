"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ContaBancaria, ContaBancariaFormSchema } from "@/lib/schemas";
import { addContaBancaria, updateContaBancaria } from "@/lib/services/contasBancarias.services";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { fetchBancos, Banco } from "@/lib/services/bancos.service";
import { Skeleton } from "@/components/ui/skeleton";

interface ContasBancariasFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  contaToEdit: ContaBancaria | null;
}

export function ContasBancariasForm({
  isOpen,
  onOpenChange,
  contaToEdit,
}: ContasBancariasFormProps) {
  const isEditing = !!contaToEdit;
  const [bancosList, setBancosList] = useState<{ label: string; value: string }[]>([]);
  const [isBancosLoading, setIsBancosLoading] = useState(true);

  const form = useForm<z.infer<typeof ContaBancariaFormSchema>>({
    resolver: zodResolver(ContaBancariaFormSchema),
  });

  useEffect(() => {
    async function loadBancos() {
      if (isOpen) {
        setIsBancosLoading(true);
        try {
          const bancos = await fetchBancos();
          const formattedBancos = bancos
            .filter((b): b is Banco & { code: string; name: string } => !!b.code && !!b.name)
            .map((b) => ({ label: `${b.code} – ${b.name}`, value: `${b.code} – ${b.name}` }));
          setBancosList(formattedBancos);
        } catch (error) {
          toast.error("Falha ao carregar a lista de bancos.");
        } finally {
          setIsBancosLoading(false);
        }
      }
    }
    loadBancos();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && contaToEdit) {
        form.reset({
          nomeConta: contaToEdit.nomeConta,
          banco: contaToEdit.banco,
          agencia: contaToEdit.agencia,
          conta: contaToEdit.conta,
          tipo: contaToEdit.tipo,
          saldoInicial: contaToEdit.saldoInicial,
        });
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

  const onSubmit = async (values: z.infer<typeof ContaBancariaFormSchema>) => {
    try {
      if (isEditing) {
        await updateContaBancaria(contaToEdit!.id!, values);
        toast.success("Conta atualizada com sucesso!");
      } else {
        await addContaBancaria(values);
        toast.success("Conta criada com sucesso!");
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao salvar conta.", { description: error.message });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Conta" : "Nova Conta Bancária"}</DialogTitle>
          <DialogDescription>
            Gerencie suas contas bancárias e caixas internos.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="nomeConta" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Conta</FormLabel>
                <FormControl><Input placeholder="Ex: Caixa Principal, Banco do Brasil" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
             <FormField control={form.control} name="tipo" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Conta Corrente">Conta Corrente</SelectItem>
                    <SelectItem value="Conta Poupança">Conta Poupança</SelectItem>
                    <SelectItem value="Caixa">Caixa</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}/>
             <FormField control={form.control} name="banco" render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Banco</FormLabel>
                  {isBancosLoading ? <Skeleton className="h-10 w-full"/> : (
                    <Combobox options={bancosList} value={field.value ?? ""} onChange={field.onChange} placeholder="Selecione um banco..." searchPlaceholder="Pesquisar banco..."/>
                  )}
                  <FormMessage/>
                </FormItem>
              )}/>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="agencia" render={({ field }) => (
                <FormItem>
                  <FormLabel>Agência</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="conta" render={({ field }) => (
                <FormItem>
                  <FormLabel>Conta</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ''}/></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>
             <FormField control={form.control} name="saldoInicial" render={({ field }) => (
              <FormItem>
                <FormLabel>Saldo Inicial</FormLabel>
                <FormControl><Input type="number" step="0.01" {...field} disabled={isEditing} /></FormControl>
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
