"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Role, roleSchema, modulosDePermissao } from "@/lib/schemas";
import { addRole, updateRole } from "@/lib/services/roles.services";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconTrash } from "@tabler/icons-react";

interface RoleFormProps {
  roleToEdit: Role | null;
  onSuccess: (role: Role) => void;
  onDelete: (id: string) => void;
}

const formSchema = roleSchema.omit({ id: true });
type FormValues = z.infer<typeof formSchema>;

export function RoleForm({
  roleToEdit,
  onSuccess,
  onDelete
}: RoleFormProps) {
  const isEditing = !!roleToEdit;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      permissoes: {},
    }
  });

  useEffect(() => {
      if (isEditing && roleToEdit) {
        form.reset({
          nome: roleToEdit.nome,
          descricao: roleToEdit.descricao || "",
          permissoes: roleToEdit.permissoes || {},
        });
      } else {
        form.reset({
          nome: "",
          descricao: "",
          permissoes: {},
        });
      }
  }, [roleToEdit, isEditing, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && roleToEdit) {
        await updateRole(roleToEdit.id!, values);
        toast.success("Função atualizada com sucesso!");
        onSuccess({ ...roleToEdit, ...values });
      } else {
        const newRoleId = await addRole(values);
        toast.success("Função criada com sucesso!");
        onSuccess({ id: newRoleId, ...values });
      }
    } catch (error: any) {
      toast.error("Erro ao salvar função.", { description: error.message });
    }
  };

  const isAdminRole = roleToEdit?.nome === 'ADMINISTRADOR';

  return (
    <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>{isEditing ? `Editando: ${roleToEdit.nome}` : "Nova Função"}</CardTitle>
                    <CardDescription>{isEditing ? "Altere os dados e permissões." : "Crie uma nova função de acesso."}</CardDescription>
                </div>
                {isEditing && !isAdminRole && (
                    <Button variant="destructive" size="icon" onClick={() => onDelete(roleToEdit.id!)}>
                        <IconTrash className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <fieldset disabled={isAdminRole} className="space-y-4 disabled:opacity-60">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="nome" render={({ field }) => (
                            <FormItem><FormLabel>Nome da Função</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="descricao" render={({ field }) => (
                            <FormItem><FormLabel>Descrição (Opcional)</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )}/>
                    </div>

                    <h3 className="text-base font-semibold pt-4 border-t">Permissões</h3>
                    <p className="text-sm text-muted-foreground -mt-2">
                        {isAdminRole ? "A função de Administrador tem acesso total a todos os módulos." : "Selecione os módulos e as ações permitidas para esta função."}
                    </p>

                    {!isAdminRole && (
                        <ScrollArea className="h-72 w-full rounded-md border">
                            <Accordion type="multiple" className="w-full p-2">
                                {Object.entries(modulosDePermissao).map(([key, value]) => (
                                <AccordionItem value={key} key={key}>
                                    <AccordionTrigger className="px-2">{value}</AccordionTrigger>
                                    <AccordionContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
                                        {['ler', 'criar', 'editar', 'inativar'].map(acao => (
                                        <FormField
                                            key={acao}
                                            control={form.control}
                                            name={`permissoes.${key}.${acao}`}
                                            render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                                                <FormLabel className="font-normal capitalize">{acao}</FormLabel>
                                            </FormItem>
                                            )}
                                        />
                                        ))}
                                    </div>
                                    </AccordionContent>
                                </AccordionItem>
                                ))}
                            </Accordion>
                        </ScrollArea>
                    )}
                </fieldset>

                {!isAdminRole && (
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        {isEditing && (<Button type="button" variant="outline" onClick={() => form.reset()}>Redefinir</Button>)}
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
                        </Button>
                    </div>
                )}
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}
