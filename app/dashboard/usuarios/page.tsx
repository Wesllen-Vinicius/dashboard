"use client";

import { useState, useEffect } from "react";
import { Unsubscribe } from "firebase/firestore";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ExpandedState, OnChangeFn } from "@tanstack/react-table";
import { SystemUser } from "@/lib/schemas";
import {
  subscribeToUsers,
  setUserStatus,
} from "@/lib/services/user.services";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { UsuarioForm } from "./components/usuario-form";
import { UsuariosActions } from "./components/usuarios-actions";
import { UsuariosTable } from "./components/usuarios-table";


export default function UsuariosPage() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<SystemUser | null>(null);
  const [idToToggle, setIdToToggle] = useState<string | null>(null);
  // CORREÇÃO: Adicionar o estado para a linha expandida
  const [expanded, setExpanded] = useState<ExpandedState>({});

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe: Unsubscribe = subscribeToUsers((data) => {
      setUsers(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // CORREÇÃO: Adicionar a função para controlar a expansão
  const handleExpansionChange: OnChangeFn<ExpandedState> = (updater) => {
    const oldExpanded = expanded;
    const newExpanded = typeof updater === 'function' ? updater(oldExpanded) : updater;
    if (Object.keys(newExpanded).length > 1) {
      const lastKey = Object.keys(newExpanded).find(key => !oldExpanded.hasOwnProperty(key));
      setExpanded(lastKey ? { [lastKey]: true } : {});
    } else {
      setExpanded(newExpanded);
    }
  };

  const handleNew = () => {
    setUserToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (user: SystemUser) => {
    setUserToEdit(user);
    setIsFormOpen(true);
  };

  const handleToggle = (id: string) => {
    setIdToToggle(id);
    setIsConfirmOpen(true);
  };

  const confirmStatusToggle = async () => {
    if (!idToToggle) return;
    const user = users.find(u => u.uid === idToToggle);
    if (!user) return;

    const newStatus = user.status === "ativo" ? "inativo" : "ativo";
    const actionText = newStatus === "inativo" ? "inativado" : "reativado";

    try {
      await setUserStatus(idToToggle, newStatus);
      toast.success(`Usuário ${actionText} com sucesso!`);
    } catch (e: any) {
      toast.error(`Erro ao ${actionText} o usuário.`, { description: e.message });
    } finally {
      setIdToToggle(null);
      setIsConfirmOpen(false);
    }
  };

  const userToToggle = users.find(u => u.uid === idToToggle);
  const isTogglingToInactive = userToToggle?.status === 'ativo';

  return (
    <>
      <ConfirmationDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={confirmStatusToggle}
        title={isTogglingToInactive ? "Confirmar Inativação" : "Confirmar Reativação"}
        description={`Você tem certeza que deseja ${isTogglingToInactive ? 'inativar' : 'reativar'} este usuário?`}
      />
      <UsuarioForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        userToEdit={userToEdit}
      />
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <UsuariosActions onNew={handleNew} />
        <UsuariosTable
          users={users}
          isLoading={isLoading}
          onEdit={handleEdit}
          onToggle={handleToggle}
          // CORREÇÃO: Passar as props que estavam faltando para a tabela
          expanded={expanded}
          onExpandedChange={handleExpansionChange}
        />
      </motion.div>
    </>
  );
}
