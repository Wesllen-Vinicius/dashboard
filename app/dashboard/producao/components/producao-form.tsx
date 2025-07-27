'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm, useFieldArray, useWatch, Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { IconTrash, IconPlus, IconTag, IconTargetArrow } from '@tabler/icons-react';
import { format, addDays } from 'date-fns';

import {
  Producao,
  producaoSchema,
  Produto,
  ProdutoVenda,
  Unidade,
} from '@/lib/schemas';
import { useAuthStore } from '@/store/auth.store';
import { useDataStore } from '@/store/data.store';
import { addProducao, updateProducao } from '@/lib/services/producao.services';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { DatePicker } from '@/components/date-picker';
import { formatNumber } from '@/lib/utils/formatters';
import { Tooltip, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const itemProduzidoFormSchema = z.object({
  produtoId: z.string().min(1, 'Selecione um produto.'),
  quantidade: z
    .coerce.number({ invalid_type_error: 'Inválido' })
    .positive('Deve ser > 0.'),
});

const formSchema = producaoSchema
  .pick({ data: true, responsavelId: true, abateId: true, descricao: true })
  .extend({
    produtos: z
      .array(itemProduzidoFormSchema)
      .min(1, 'Adicione pelo menos um produto.'),
  });

type ProducaoFormValues = z.infer<typeof formSchema>;

interface ResumoAbate {
  id: string;
  animaisValidos: number;
  metas: { produtoId: string; produtoNome: string; meta: number; unidade: string }[];
}

function isProdutoVenda(p: Produto): p is ProdutoVenda {
  return p.tipoProduto === 'VENDA';
}

function ItemRow({
  control,
  index,
  remove,
  produtosData,
  unidades,
}: {
  control: Control<ProducaoFormValues>;
  index: number;
  remove: (i: number) => void;
  produtosData: { options: { label: string; value: string }[]; produtos: Produto[] };
  unidades: Unidade[];
}) {
  const produtoId = useWatch({ control, name: `produtos.${index}.produtoId` });
  const produto = produtosData.produtos.find((p) => p.id === produtoId) || null;

  const unidadeId = produto && 'unidadeId' in produto ? produto.unidadeId : '';
  const sigla = unidades.find((u) => u.id === unidadeId)?.sigla.toUpperCase() || 'UN';
  const step = sigla.toLowerCase() === 'kg' ? '0.01' : '1';
  const controlaLote = produto && isProdutoVenda(produto) ? produto.controlaLote : false;

  return (
    <motion.div
      className="flex items-end gap-2 p-3 border rounded-md"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
    >
      <FormField
        name={`produtos.${index}.produtoId`}
        control={control}
        render={({ field }) => (
          <FormItem className="flex-1">
            <div className="flex items-center justify-between">
              <FormLabel>Produto *</FormLabel>
              {controlaLote && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <IconTag className="h-4 w-4 text-primary" />
                    </TooltipTrigger>
                    <p>Este produto controla lote.</p>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <Combobox
              options={produtosData.options}
              {...field}
              value={field.value ?? ''}
              placeholder="Selecione..."
            />
          </FormItem>
        )}
      />
      <FormField
        name={`produtos.${index}.quantidade`}
        control={control}
        render={({ field }) => (
          <FormItem className="w-40">
            <FormLabel>Qtd. Produzida {sigla} *</FormLabel>
            <FormControl>
              <Input
                type="number"
                step={step}
                placeholder={sigla === 'KG' ? '0,00' : '0'}
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <Button
        type="button"
        size="icon"
        variant="destructive"
        onClick={() => remove(index)}
      >
        <IconTrash className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}

const defaultValues: ProducaoFormValues = {
  data: new Date(),
  responsavelId: '',
  abateId: '',
  produtos: [],
  descricao: '',
};

export function ProducaoForm({
  isOpen,
  onOpenChange,
  producaoToEdit,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  producaoToEdit?: Producao | null;
}) {
  const { user } = useAuthStore();
  const { funcionarios, abates, produtos, unidades } = useDataStore();
  const isEditing = Boolean(producaoToEdit);
  const [resumoAbate, setResumoAbate] = useState<ResumoAbate | null>(null);

  const form = useForm<ProducaoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onChange',
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'produtos' });

  // reset / load edit
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        form.reset(defaultValues);
        setResumoAbate(null);
      }, 150);
    } else if (isEditing && producaoToEdit) {
      form.reset({ ...producaoToEdit, data: new Date(producaoToEdit.data) });
    }
  }, [isOpen, isEditing, producaoToEdit, form]);

  // quando abate muda, calcula metas
  const abateId = useWatch({ control: form.control, name: 'abateId' });
  useEffect(() => {
    if (!abateId) return setResumoAbate(null);
    const ab = abates.find((a) => a.id === abateId)!;
    const validos = ab.numeroAnimais - (ab.condenado || 0);
    const produtosVenda = produtos.filter(
      (p): p is ProdutoVenda => p.tipoProduto === 'VENDA' && !!p.metaPorAnimal
    );
    const metas = produtosVenda.map((p) => ({
      produtoId: p.id!,
      produtoNome: p.nome,
      meta: validos * (p.metaPorAnimal || 0),
      unidade: unidades.find((u) => u.id === p.unidadeId)?.sigla || 'UN',
    }));
    setResumoAbate({ id: ab.id!, animaisValidos: validos, metas });
  }, [abateId, abates, produtos, unidades]);

  const produtosOptions = useMemo(
    () => ({
      options: produtos.map((p) => ({ label: p.nome, value: p.id! })),
      produtos,
    }),
    [produtos]
  );

  // **apenas** abates aguardando
  const abatesDisponiveis = useMemo(
    () =>
      abates
        .filter((a) => a.status === 'Aguardando Processamento')
        .map((a) => ({
          label: `${a.loteId || 'Lote sem ID'} - ${format(new Date(a.data), 'dd/MM/yy')}`,
          value: a.id!,
        })),
    [abates]
  );

  const onSubmit = async (values: ProducaoFormValues) => {
    if (!user) return toast.error('Autenticação necessária.');
    const ab = abates.find((a) => a.id === values.abateId);
    if (!ab) return toast.error('Abate inválido.');
    const lote = ab.loteId || `LOTE-${values.data.getTime()}`;

    // gera lotes, perdas etc
    const lotesGerados = values.produtos
      .filter((item) => {
        const p = produtos.find((x) => x.id === item.produtoId);
        return p && isProdutoVenda(p) && p.controlaLote;
      })
      .map((item) => {
        const p = produtos.find((x) => x.id === item.produtoId)! as ProdutoVenda;
        return {
          loteNumero: `${lote}-${p.sku || p.id!.slice(0, 4)}`,
          produtoId: p.id!,
          produtoNome: p.nome,
          quantidadeInicial: item.quantidade,
          quantidadeAtual: item.quantidade,
          dataProducao: values.data,
          dataValidade: addDays(values.data, p.diasValidade || 0),
        };
      });

    // cálcula perda e unidade
    const produtosComPerda = values.produtos.map((item) => {
      const p = produtos.find((x) => x.id === item.produtoId)!;
      const metaObj = resumoAbate?.metas.find((m) => m.produtoId === item.produtoId);
      const perda = Math.max((metaObj?.meta || 0) - item.quantidade, 0);
      const uni = 'unidadeId' in p
        ? unidades.find((u) => u.id === p.unidadeId)?.sigla.toUpperCase() || 'UN'
        : 'UN';
      return {
        produtoId: p.id!,
        produtoNome: p.nome,
        quantidade: item.quantidade,
        perda,
        unidadeId: 'unidadeId' in p ? p.unidadeId : '',
        unidadeSigla: uni,
      };
    });

    const payload = {
      ...values,
      produtos: produtosComPerda,
      lote,
      registradoPor: { uid: user.uid, nome: user.displayName || 'Usuário' },
      lotesGerados,
    };

    const exec = isEditing && producaoToEdit?.id
      ? updateProducao(producaoToEdit.id, payload)
      : addProducao(payload as any);

    toast.promise(exec, {
      loading: 'Salvando produção...',
      success: () => {
        onOpenChange(false);
        return 'Produção salva!';
      },
      error: (e: any) => `Erro: ${e.message}`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Produção' : 'Registrar Nova Produção'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            id="producao-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="data"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Produção *</FormLabel>
                    <DatePicker date={field.value} onDateChange={field.onChange} />
                  </FormItem>
                )}
              />
              <FormField
                name="responsavelId"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável *</FormLabel>
                    <Combobox
                      options={funcionarios.map((f) => ({ label: f.nomeCompleto, value: f.id! }))}
                      {...field}
                      placeholder="Selecione"
                      value={field.value ?? ''}
                    />
                  </FormItem>
                )}
              />
              <FormField
                name="abateId"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Abate de Origem *</FormLabel>
                    <Combobox
                      options={abatesDisponiveis}
                      {...field}
                      placeholder="Selecione um lote"
                      value={field.value ?? ''}
                    />
                  </FormItem>
                )}
              />
            </div>

            {resumoAbate && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <div className="flex items-center space-x-2 mb-3">
                  <IconTargetArrow className="h-5 w-5 text-primary" />
                  <h4 className="text-sm font-semibold">
                    Metas para este Lote ({resumoAbate.animaisValidos} animais)
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {resumoAbate.metas.map((m) => (
                    <Card key={m.produtoId} className="border">
                      <CardHeader className="bg-muted p-2">
                        <CardTitle className="text-xs">{m.produtoNome}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 text-center">
                        <span className="text-lg font-bold">{formatNumber(m.meta)}</span>{' '}
                        <span className="text-sm text-muted-foreground">{m.unidade}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Itens Produzidos</h3>
                <Button type="button" size="sm" variant="outline" onClick={() => append({ produtoId: '', quantidade: 0 })}>
                  <IconPlus className="mr-2 h-4 w-4" /> Adicionar
                </Button>
              </div>
              <AnimatePresence>
                {fields.map((f, i) => (
                  <ItemRow
                    key={f.id}
                    control={form.control}
                    index={i}
                    remove={remove}
                    produtosData={produtosOptions}
                    unidades={unidades}
                  />
                ))}
              </AnimatePresence>
              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Adicione pelo menos um produto.
                </p>
              )}
            </div>
          </form>
        </Form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="producao-form"
            disabled={!form.formState.isValid || form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Produção'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
