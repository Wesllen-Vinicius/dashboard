"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";

import { useAuthStore } from "@/store/auth.store";
import { Fornecedor, FornecedorFormSchema } from "@/lib/schemas";
import {
  addFornecedor,
  updateFornecedor,
} from "@/lib/services/fornecedores.services";
import { fetchCnpjData, fetchCepData } from "@/lib/services/brasilapi.services";
import { fetchBancos, Banco } from "@/lib/services/bancos.service";
import { formatCep } from "@/lib/utils/formatters";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InputMask } from "@react-input/mask";
import { IconLoader2, IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { Progress } from "@/components/ui/progress";
import { Combobox } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { TruncatedCell } from "@/components/ui/truncated-cell";


type FormValues = z.infer<typeof FornecedorFormSchema>;

const defaultFormValues: FormValues = {
  tipoPessoa: "juridica",
  cpfCnpj: "",
  nomeRazaoSocial: "",
  nomeFantasia: "",
  inscricaoEstadual: "",
  email: "",
  telefone: "",
  endereco: { cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "" },
  banco: { nome: "", agencia: "", conta: "", pix: "" },
};

const steps = [
  { id: 1, name: "Dados Gerais", fields: ["tipoPessoa", "cpfCnpj", "nomeRazaoSocial", "nomeFantasia", "inscricaoEstadual", "email", "telefone"] },
  { id: 2, name: "Endereço", fields: ["endereco.cep", "endereco.logradouro", "endereco.numero", "endereco.bairro", "endereco.cidade", "endereco.uf"] },
  { id: 3, name: "Dados Bancários", fields: ["banco.nome", "banco.agencia", "banco.conta", "banco.pix"] },
];

interface FormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  fornecedorToEdit?: Fornecedor | null;
}

export function FornecedoresForm({
  isOpen,
  onOpenChange,
  fornecedorToEdit,
}: FormProps) {
  const { user } = useAuthStore();
  const isEditing = !!fornecedorToEdit;
  const [currentStep, setCurrentStep] = useState(0);
  const [isCnpjLoading, setIsCnpjLoading] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [bancosList, setBancosList] = useState<{ label: string; value: string }[]>([]);
  const [isBancosLoading, setIsBancosLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(FornecedorFormSchema),
    defaultValues: defaultFormValues,
    mode: 'onChange',
  });

  const tipoPessoa = form.watch("tipoPessoa");

  useEffect(() => {
    async function loadBancos() {
      if(isOpen) {
        setIsBancosLoading(true);
        try {
          const bancos = await fetchBancos();
          const formattedBancos = bancos
            .filter((b): b is Banco & { code: string; name: string } => !!b.code && !!b.name)
            .map((b) => ({
              label: `${b.code} – ${b.name}`,
              value: b.name,
            }));
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
      setCurrentStep(0);
      if (isEditing && fornecedorToEdit) {
        const valuesToSet = {
          ...defaultFormValues, ...fornecedorToEdit,
          endereco: { ...defaultFormValues.endereco, ...fornecedorToEdit.endereco, cep: formatCep(fornecedorToEdit.endereco?.cep) },
          banco: { ...defaultFormValues.banco, ...fornecedorToEdit.banco },
        };
        form.reset(valuesToSet);
      } else {
        form.reset(defaultFormValues);
      }
    }
  }, [isOpen, fornecedorToEdit, isEditing, form]);

  const nextStep = async () => {
    const fields = steps[currentStep].fields;
    const output = await form.trigger(fields as any, { shouldFocus: true });
    if (output && currentStep < steps.length - 1) {
      setCurrentStep(step => step + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(step => step - 1);
    }
  };

  const handleCnpjSearch = async () => {
    const cnpj = form.getValues("cpfCnpj");
    setIsCnpjLoading(true);
    try {
      const data = await fetchCnpjData(cnpj);
      form.setValue("endereco.cep", formatCep(data.cep), { shouldValidate: true });
      form.setValue("nomeRazaoSocial", data.razao_social || "", { shouldValidate: true });
      form.setValue("nomeFantasia", data.nome_fantasia || "", { shouldValidate: true });
      form.setValue("endereco.logradouro", data.logradouro || "", { shouldValidate: true });
      form.setValue("endereco.bairro", data.bairro || "", { shouldValidate: true });
      form.setValue("endereco.cidade", data.municipio || "", { shouldValidate: true });
      form.setValue("endereco.uf", data.uf || "", { shouldValidate: true });
      form.setValue("telefone", data.ddd_telefone_1 || "", { shouldValidate: true });
      toast.success("Dados do CNPJ preenchidos.");
      if (data.cep) handleCepSearch(data.cep);
    } catch (error: any) {
      toast.error("Erro ao buscar CNPJ.", { description: error.message });
    } finally {
      setIsCnpjLoading(false);
    }
  };

  const handleCepSearch = async (cepValue?: string) => {
    const cep = cepValue || form.getValues("endereco.cep");
    if (!cep) return;
    setIsCepLoading(true);
    try {
      const data = await fetchCepData(cep);
      form.setValue("endereco.logradouro", data.street || "", { shouldValidate: true });
      form.setValue("endereco.bairro", data.neighborhood || "", { shouldValidate: true });
      form.setValue("endereco.cidade", data.city || "", { shouldValidate: true });
      form.setValue("endereco.uf", data.state || "", { shouldValidate: true });
    } catch (error) {
      toast.error("CEP não encontrado.");
    } finally {
      setIsCepLoading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (!user) throw new Error("Usuário não autenticado.");
      if (isEditing && fornecedorToEdit?.id) {
        await updateFornecedor(fornecedorToEdit.id, values);
        toast.success("Fornecedor atualizado com sucesso!");
      } else {
        await addFornecedor(values, user);
        toast.success("Novo fornecedor adicionado!");
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Falha ao salvar o fornecedor.", { description: error.message });
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Fornecedor" : "Adicionar Novo Fornecedor"}
          </DialogTitle>
          <DialogDescription>
            Siga os passos para preencher os dados do fornecedor.
          </DialogDescription>
        </DialogHeader>

        <Progress value={progress} className="w-full h-2 mt-2" />

        <Form {...form}>
          <form
            id="fornecedor-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="py-4 min-h-[350px]"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -30, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">{steps[0].name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField name="tipoPessoa" control={form.control} render={({ field }) => ( <FormItem><FormLabel><TruncatedCell>Tipo *</TruncatedCell></FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="juridica">Pessoa Jurídica</SelectItem><SelectItem value="fisica">Pessoa Física</SelectItem></SelectContent></Select></FormItem> )}/>
                      <Controller name="cpfCnpj" control={form.control} render={({ field, fieldState }) => ( <FormItem className="md:col-span-2"><FormLabel><TruncatedCell>{tipoPessoa === 'juridica' ? "CNPJ *" : "CPF *"}</TruncatedCell></FormLabel><div className="flex gap-2"><InputMask {...field} mask={tipoPessoa === 'juridica' ? "__.___.___/____-__" : "___.___.___-__"} replacement={{ _: /\d/ }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"/>{tipoPessoa === 'juridica' && ( <Button type="button" onClick={handleCnpjSearch} disabled={isCnpjLoading}>{isCnpjLoading ? <IconLoader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}</Button> ) }</div>{fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}</FormItem> )}/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField name="nomeRazaoSocial" control={form.control} render={({ field }) => (<FormItem><FormLabel><TruncatedCell>{tipoPessoa === 'juridica' ? 'Razão Social *' : 'Nome Completo *'}</TruncatedCell></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        {tipoPessoa === 'juridica' && <FormField name="nomeFantasia" control={form.control} render={({ field }) => (<FormItem><FormLabel><TruncatedCell>Nome Fantasia</TruncatedCell></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField name="inscricaoEstadual" control={form.control} render={({ field }) => ( <FormItem><FormLabel><TruncatedCell>Inscrição Estadual</TruncatedCell></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField name="email" control={form.control} render={({ field }) => ( <FormItem><FormLabel><TruncatedCell>E-mail</TruncatedCell></FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <Controller name="telefone" control={form.control} render={({ field }) => ( <FormItem><FormLabel><TruncatedCell>Telefone</TruncatedCell></FormLabel><FormControl><InputMask mask="(__) ____-____" replacement={{ _: /\d/ }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground">{steps[1].name}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <Controller name="endereco.cep" control={form.control} render={({ field }) => ( <FormItem><FormLabel><TruncatedCell>CEP</TruncatedCell></FormLabel><div className="flex gap-2"><InputMask mask="_____-___" replacement={{ _: /\d/ }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...field} onBlur={() => handleCepSearch()}/>{isCepLoading && <IconLoader2 className="h-5 w-5 animate-spin" />}</div></FormItem> )}/>
                            <FormField name="endereco.logradouro" control={form.control} render={({ field }) => (<FormItem className="md:col-span-3"><FormLabel><TruncatedCell>Logradouro</TruncatedCell></FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <FormField name="endereco.numero" control={form.control} render={({ field }) => (<FormItem><FormLabel><TruncatedCell>Número</TruncatedCell></FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField name="endereco.complemento" control={form.control} render={({ field }) => (<FormItem className="md:col-span-3"><FormLabel><TruncatedCell>Complemento</TruncatedCell></FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField name="endereco.bairro" control={form.control} render={({ field }) => (<FormItem><FormLabel><TruncatedCell>Bairro</TruncatedCell></FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField name="endereco.cidade" control={form.control} render={({ field }) => (<FormItem><FormLabel><TruncatedCell>Cidade</TruncatedCell></FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField name="endereco.uf" control={form.control} render={({ field }) => (<FormItem><FormLabel><TruncatedCell>UF</TruncatedCell></FormLabel><FormControl><Input maxLength={2} {...field} /></FormControl></FormItem>)} />
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground">{steps[2].name}</h3>
                        <FormField
                            name="banco.nome"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel><TruncatedCell>Nome do Banco</TruncatedCell></FormLabel>
                                  {isBancosLoading ? <Skeleton className="h-10 w-full" /> : (
                                      <Combobox
                                        options={bancosList}
                                        value={field.value ?? ""}
                                        onChange={field.onChange}
                                        placeholder="Selecione um banco..."
                                        searchPlaceholder="Pesquisar banco..."
                                      />
                                  )}
                                  <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField name="banco.agencia" control={form.control} render={({ field }) => (<FormItem><FormLabel><TruncatedCell>Agência</TruncatedCell></FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                            <FormField name="banco.conta" control={form.control} render={({ field }) => (<FormItem><FormLabel><TruncatedCell>Conta Corrente</TruncatedCell></FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                        </div>
                        <FormField name="banco.pix" control={form.control} render={({ field }) => (<FormItem><FormLabel><TruncatedCell>Chave PIX</TruncatedCell></FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                    </div>
                )}
              </motion.div>
            </AnimatePresence>
          </form>
        </Form>
        <DialogFooter className="mt-6 pt-4 border-t">
          <div className="flex justify-between w-full">
            <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 0}>
                <IconArrowLeft className="h-4 w-4 mr-2" />
                Voltar
            </Button>

            {currentStep < steps.length - 1 && (
              <Button type="button" onClick={nextStep}>
                Avançar
                <IconArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {currentStep === steps.length - 1 && (
              <Button
                type="submit"
                form="fornecedor-form"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Salvando..." : (isEditing ? "Salvar Alterações" : "Finalizar Cadastro")}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
