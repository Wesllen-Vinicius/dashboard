"use client";

import { useState, useEffect } from "react";
import { Unsubscribe } from "firebase/firestore";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Role } from "@/lib/schemas";
import {
  subscribeToRoles,
  deleteRole,
} from "@/lib/services/roles.services";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { PermissoesActions } from "./components/permissoes-actions";
import { RoleForm } from "./components/role-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconPencil, IconTrash } from "@tabler/icons-react"; // Importar ícones

export default function PermissoesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe: Unsubscribe = subscribeToRoles((data) => {
      setRoles(data);
      if (data.length > 0 && !selectedRole) {
        setSelectedRole(data[0]);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleNew = () => {
    setSelectedRole(null);
  };

  const handleDelete = (id: string) => {
    if (roles.find(r => r.id === id)?.nome === 'ADMINISTRADOR') {
        toast.error("A função de Administrador não pode ser excluída.");
        return;
    }
    setIdToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!idToDelete) return;
    try {
      await deleteRole(idToDelete);
      toast.success("Função excluída com sucesso!");
      // Seleciona a primeira função da lista restante após a exclusão
      const remainingRoles = roles.filter(r => r.id !== idToDelete);
      setSelectedRole(remainingRoles.length > 0 ? remainingRoles[0] : null);
    } catch (e: any) {
      toast.error("Erro ao excluir função.", { description: "Verifique se ela não está sendo usada por algum usuário." });
    } finally {
      setIdToDelete(null);
      setIsConfirmOpen(false);
    }
  };

  const handleSelectRole = (role: Role) => {
      setSelectedRole(role);
  }

  return (
    <>
      <ConfirmationDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        description="Você tem certeza que deseja excluir esta função? Esta ação não pode ser desfeita."
      />
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <PermissoesActions onNew={handleNew} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
                <CardContent className="p-4 space-y-1">
                    <h3 className="text-lg font-semibold px-2 mb-2">Funções</h3>
                    {isLoading ? (
                        <p className="text-sm text-muted-foreground px-2">Carregando...</p>
                    ) : (
                        roles.map(role => (
                            <div
                                key={role.id}
                                onClick={() => handleSelectRole(role)}
                                className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${selectedRole?.id === role.id ? "bg-muted" : "hover:bg-muted/50"}`}
                            >
                                <span className="font-medium text-sm">{role.nome}</span>
                                <div className="flex items-center">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={(e) => { e.stopPropagation(); handleSelectRole(role); }}
                                    >
                                        <IconPencil className="h-4 w-4" />
                                    </Button>
                                    {role.nome !== 'ADMINISTRADOR' && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={(e) => { e.stopPropagation(); handleDelete(role.id!); }}
                                        >
                                            <IconTrash className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            <div className="md:col-span-2">
                <RoleForm
                    key={selectedRole?.id ?? 'new'}
                    roleToEdit={selectedRole}
                    onSuccess={setSelectedRole}
                    onDelete={handleDelete}
                />
            </div>
        </div>
      </motion.div>
    </>
  );
}
