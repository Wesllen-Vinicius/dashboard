"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Meta, metaSchema, Produto, Unidade } from "@/lib/schemas";
import { addMeta, updateMeta } from "@/lib/services/metas.services";
import { useDataStore } from "@/store/data.store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MetaFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  metaToEdit: Meta | null;
  produtosDeVenda: Produto[]; // Recebe a lista de produtos como propriedade
}

const formSchema = metaSchema.pick({ produtoId: true, metaPorAnimal: true });

export function MetaForm({
  isOpen,
  onOpenChange,
  metaToEdit,
  produtosDeVenda, // Usa a propriedade
}: MetaFormProps) {
  const isEditing = !!metaToEdit;
  const { unidades } = useDataStore(); // Pega as unidades do store global

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing && metaToEdit) {
        form.reset({
          produtoId: metaToEdit.produtoId,
          metaPorAnimal: metaToEdit.metaPorAnimal,
        });
      } else {
        form.reset({
          produtoId: "",
          metaPorAnimal: 0,
        });
      }
    }
  }, [isOpen, metaToEdit, isEditing, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const produtoSelecionado = produtosDeVenda.find(p => p.id === values.produtoId);
      if (!produtoSelecionado || produtoSelecionado.tipoProduto !== 'VENDA') {
        toast.error("Produto selecionado é inválido.");
        return;
      }

      const unidade = unidades.find(u => u.id === produtoSelecionado.unidadeId);

      // Desnormaliza os dados para salvar no documento da meta
      const data: Omit<Meta, "id" | "status" | "createdAt"> = {
          ...values,
          produtoNome: produtoSelecionado.nome,
          unidade: unidade?.sigla || 'UN',
      }

      if (isEditing && metaToEdit?.id) {
        await updateMeta(metaToEdit.id, data);
        toast.success("Meta atualizada com sucesso!");
      } else {
        await addMeta(data);
        toast.success("Meta criada com sucesso!");
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao salvar meta.", { description: error.message });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Meta" : "Nova Meta"}</DialogTitle>
          <DialogDescription>
            Defina uma meta de produção por animal para um produto específico.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="produtoId" render={({ field }) => (
              <FormItem>
                <FormLabel>Produto</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {produtosDeVenda.map(produto => (
                      <SelectItem key={produto.id} value={produto.id!}>{produto.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}/>
             <FormField control={form.control} name="metaPorAnimal" render={({ field }) => (
              <FormItem>
                <FormLabel>Meta por Animal</FormLabel>
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
