"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { Funcionario, funcionarioSchema, Cargo } from "@/lib/schemas";
import { addFuncionario, updateFuncionario } from "@/lib/services/funcionarios.services";
import { subscribeToCargos } from "@/lib/services/cargos.services";
import { fetchCnpjData, fetchCepData } from "@/lib/services/brasilapi.services";
import { fetchBancos, Banco } from "@/lib/services/bancos.service";
import { unmask } from "@/lib/utils/formatters";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InputMask } from "@react-input/mask";
import { IconLoader2, IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { Progress } from "@/components/ui/progress";
import { Combobox } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = funcionarioSchema.pick({
  razaoSocial: true,
  cnpj: true,
  nomeCompleto: true,
  cpf: true,
  contato: true,
  cargoId: true,
  banco: true,
  agencia: true,
  conta: true,
  endereco: true,
});

type FormValues = z.infer<typeof formSchema>;

const defaultFormValues: FormValues = {
  razaoSocial: "",
  cnpj: "",
  nomeCompleto: "",
  cpf: "",
  contato: "",
  cargoId: "",
  banco: "",
  agencia: "",
  conta: "",
  endereco: {
    cep: "",
    logradouro: "",
    numero: "",
    bairro: "",
    cidade: "",
    uf: "",
    complemento: "",
    pais: "Brasil",
    codigoPais: "1058",
  },
};

const steps = [
    { id: 1, name: "Dados da Empresa (MEI)", fields: ["cnpj", "razaoSocial"] },
    { id: 2, name: "Dados Pessoais", fields: ["nomeCompleto", "cpf", "contato"] },
    { id: 3, name: "Endereço", fields: ["endereco.cep", "endereco.logradouro", "endereco.numero", "endereco.bairro", "endereco.cidade", "endereco.uf"] },
    { id: 4, name: "Dados Profissionais e Bancários", fields: ["cargoId", "banco", "agencia", "conta"] },
];

interface FormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  funcionarioToEdit?: Funcionario | null;
}

export function FuncionarioForm({
  isOpen,
  onOpenChange,
  funcionarioToEdit,
}: FormProps) {
  const isEditing = !!funcionarioToEdit;
  const [currentStep, setCurrentStep] = useState(0);
  const [isApiLoading, setIsApiLoading] = useState({ cnpj: false, cep: false, bancos: true });
  const [bancosList, setBancosList] = useState<{ label: string; value: string }[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
    mode: 'onChange',
  });

  useEffect(() => {
    if (isOpen) {
      const unsubCargos = subscribeToCargos((data) => {
        setCargos(data.filter(c => c.status === 'ativo'));
      });

      async function loadBancos() {
        setIsApiLoading(prev => ({ ...prev, bancos: true }));
        try {
          const bancos = await fetchBancos();
          const formattedBancos = bancos
            .filter((b): b is Banco & { code: string; name: string } => !!b.code && !!b.name)
            .map((b) => ({ label: `${b.code} – ${b.name}`, value: b.name, }));
          setBancosList(formattedBancos);
        } catch (error) {
          toast.error("Falha ao carregar bancos.");
        } finally {
          setIsApiLoading(prev => ({ ...prev, bancos: false }));
        }
      }
      loadBancos();
      return () => unsubCargos();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      if (isEditing && funcionarioToEdit) {
        form.reset({
          ...defaultFormValues,
          ...funcionarioToEdit,
          cnpj: unmask(funcionarioToEdit.cnpj),
          cpf: unmask(funcionarioToEdit.cpf),
          contato: unmask(funcionarioToEdit.contato),
          endereco: {
            ...defaultFormValues.endereco,
            ...funcionarioToEdit.endereco,
            cep: unmask(funcionarioToEdit.endereco?.cep)
          }
        });
      } else {
        form.reset(defaultFormValues);
      }
    }
  }, [isOpen, funcionarioToEdit, isEditing, form]);

  const nextStep = async () => {
    const fields = steps[currentStep].fields;
    const output = await form.trigger(fields as any, { shouldFocus: true });
    if (output && currentStep < steps.length - 1) {
      setCurrentStep(step => step + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(step => step - 1);
  };

  const handleApiSearch = async (type: 'cnpj' | 'cep') => {
    const value = form.getValues(type === 'cnpj' ? 'cnpj' : 'endereco.cep');
    setIsApiLoading(prev => ({ ...prev, [type]: true }));
    try {
      if (type === 'cnpj') {
        const data = await fetchCnpjData(value);
        form.setValue("razaoSocial", data.razao_social || "", { shouldValidate: true });
        form.setValue("contato", unmask(data.ddd_telefone_1), { shouldValidate: true });
        form.setValue("endereco.cep", unmask(data.cep), { shouldValidate: true });
        form.setValue("endereco.cidade", data.municipio || "", { shouldValidate: true });
        form.setValue("endereco.uf", data.uf || "", { shouldValidate: true });
        form.setValue("endereco.bairro", data.bairro || "", { shouldValidate: true });
        form.setValue("endereco.logradouro", data.logradouro || "", { shouldValidate: true });
        toast.success("Dados do CNPJ preenchidos.");
      } else {
        const data = await fetchCepData(value);
        form.setValue("endereco.cidade", data.city || "", { shouldValidate: true });
        form.setValue("endereco.uf", data.state || "", { shouldValidate: true });
        form.setValue("endereco.bairro", data.neighborhood || "", { shouldValidate: true });
        form.setValue("endereco.logradouro", data.street || "", { shouldValidate: true });
        toast.success("Endereço preenchido.");
      }
    } catch (error: any) {
      toast.error(`Erro ao buscar ${type.toUpperCase()}.`, { description: error.message });
    } finally {
      setIsApiLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const onSubmit = async (values: FormValues) => {
    const cargoSelecionado = cargos.find((c) => c.id === values.cargoId);
    if (!cargoSelecionado) {
      toast.error("Cargo selecionado é inválido.");
      return;
    }
    const finalData = { ...values, cargoNome: cargoSelecionado.nome };
    try {
      if (isEditing && funcionarioToEdit?.id) {
        await updateFuncionario(funcionarioToEdit.id, finalData);
        toast.success("Funcionário atualizado!");
      } else {
        await addFuncionario(finalData);
        toast.success("Novo funcionário adicionado!");
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Falha ao salvar o funcionário.", { description: error.message });
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Funcionário" : "Adicionar Funcionário"}</DialogTitle>
          <DialogDescription>Siga os passos para preencher os dados.</DialogDescription>
        </DialogHeader>
        <Progress value={progress} className="w-full h-2 mt-2" />
        <Form {...form}>
          <form id="funcionario-form" onSubmit={form.handleSubmit(onSubmit)} className="py-4 min-h-[380px]">
            <AnimatePresence mode="wait">
              <motion.div key={currentStep} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }} transition={{ duration: 0.3 }}>
                {currentStep === 0 && (
                  <div className="space-y-4"><h3 className="text-lg font-semibold">{steps[0].name}</h3>
                    <Controller name="cnpj" control={form.control} render={({ field, fieldState }) => (<FormItem><FormLabel>CNPJ *</FormLabel><div className="flex gap-2"><InputMask {...field} mask="##.###.###/####-##" replacement={{ "#": /\d/ }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"/><Button type="button" onClick={() => handleApiSearch('cnpj')} disabled={isApiLoading.cnpj || fieldState.invalid}>{isApiLoading.cnpj ? <IconLoader2 className="h-4 w-4 animate-spin"/> : 'Buscar'}</Button></div><FormMessage>{fieldState.error?.message}</FormMessage></FormItem>)}/>
                    <FormField name="razaoSocial" control={form.control} render={({ field }) => (<FormItem><FormLabel>Razão Social *</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>)}/>
                  </div>
                )}
                {currentStep === 1 && (
                  <div className="space-y-4"><h3 className="text-lg font-semibold">{steps[1].name}</h3>
                    <FormField name="nomeCompleto" control={form.control} render={({ field }) => (<FormItem><FormLabel>Nome Completo *</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>)}/>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Controller name="cpf" control={form.control} render={({ field, fieldState }) => (<FormItem><FormLabel>CPF *</FormLabel><FormControl><InputMask mask="###.###.###-##" replacement={{ "#": /\d/ }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...field}/></FormControl><FormMessage>{fieldState.error?.message}</FormMessage></FormItem>)}/>
                      <Controller
                        name="contato"
                        control={form.control}
                        render={({ field, fieldState }) => {
                          const phoneMask = (field.value?.length ?? 0) > 10 ? '(__) _____-____' : '(__) ____-____';
                          return (
                            <FormItem>
                              <FormLabel>Telefone *</FormLabel>
                              <FormControl>
                                <InputMask
                                  {...field}
                                  mask={phoneMask}
                                  replacement={{ _: /\d/ }}
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                              </FormControl>
                              <FormMessage>{fieldState.error?.message}</FormMessage>
                            </FormItem>
                          );
                        }}
                      />
                    </div>
                  </div>
                )}
                {currentStep === 2 && (
                    <div className="space-y-4"><h3 className="text-lg font-semibold">{steps[2].name}</h3>
                        <Controller name="endereco.cep" control={form.control} render={({ field, fieldState }) => (<FormItem><FormLabel>CEP</FormLabel><div className="flex gap-2"><InputMask {...field} mask="_____-___" replacement={{ "_": /\d/ }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"/><Button type="button" onClick={() => handleApiSearch('cep')} disabled={isApiLoading.cep || fieldState.invalid}>{isApiLoading.cep ? <IconLoader2 className="h-4 w-4 animate-spin"/> : 'Buscar'}</Button></div><FormMessage>{fieldState.error?.message}</FormMessage></FormItem>)}/>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField name="endereco.logradouro" control={form.control} render={({ field }) => (<FormItem className="col-span-2"><FormLabel>Logradouro</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage/></FormItem>)}/>
                            <FormField name="endereco.numero" control={form.control} render={({ field }) => (<FormItem><FormLabel>Número</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage/></FormItem>)}/>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField name="endereco.bairro" control={form.control} render={({ field }) => (<FormItem><FormLabel>Bairro</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage/></FormItem>)}/>
                            <FormField name="endereco.cidade" control={form.control} render={({ field }) => (<FormItem><FormLabel>Cidade</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage/></FormItem>)}/>
                            <FormField name="endereco.uf" control={form.control} render={({ field }) => (<FormItem><FormLabel>UF</FormLabel><FormControl><Input maxLength={2} {...field} value={field.value ?? ''} /></FormControl><FormMessage/></FormItem>)}/>
                        </div>
                    </div>
                )}
                {currentStep === 3 && (
                    <div className="space-y-4"><h3 className="text-lg font-semibold">{steps[3].name}</h3>
                      <FormField name="cargoId" control={form.control} render={({ field }) => (<FormItem><FormLabel>Cargo *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione um cargo"/></SelectTrigger></FormControl><SelectContent>{cargos.map((cargo) => (<SelectItem key={cargo.id} value={cargo.id!}>{cargo.nome}</SelectItem>))}</SelectContent></Select><FormMessage/></FormItem>)}/>
                      <FormField name="banco" control={form.control} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Banco *</FormLabel>{isApiLoading.bancos ? <Skeleton className="h-10 w-full"/> : (<Combobox options={bancosList} value={field.value ?? ""} onChange={field.onChange} placeholder="Selecione um banco..." searchPlaceholder="Pesquisar banco..."/>)}<FormMessage/></FormItem>)}/>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField name="agencia" control={form.control} render={({ field }) => (<FormItem><FormLabel>Agência *</FormLabel><FormControl><Input {...field} value={field.value ?? ''}/></FormControl><FormMessage/></FormItem>)}/>
                        <FormField name="conta" control={form.control} render={({ field }) => (<FormItem><FormLabel>Conta Corrente *</FormLabel><FormControl><Input {...field} value={field.value ?? ''}/></FormControl><FormMessage/></FormItem>)}/>
                      </div>
                    </div>
                )}
              </motion.div>
            </AnimatePresence>
          </form>
        </Form>
        <DialogFooter className="mt-6 pt-4 border-t">
          <div className="flex justify-between w-full">
            <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 0}><IconArrowLeft className="h-4 w-4 mr-2"/>Voltar</Button>
            {currentStep < steps.length - 1 && (<Button type="button" onClick={nextStep}>Avançar<IconArrowRight className="h-4 w-4 ml-2"/></Button>)}
            {currentStep === steps.length - 1 && (<Button type="submit" form="funcionario-form" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Salvando..." : (isEditing ? "Salvar Alterações" : "Finalizar")}</Button>)}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
