"use client";

import { useState, useEffect } from "react";
import { Unsubscribe } from "firebase/firestore";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ExpandedState, OnChangeFn } from "@tanstack/react-table";
import { Funcionario } from "@/lib/schemas";
import {
  subscribeToFuncionarios,
  setFuncionarioStatus,
} from "@/lib/services/funcionarios.services";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { FuncionariosActions } from "./components/funcionarios-actions";
import { FuncionarioForm } from "./components/funcionario-form";
import { FuncionariosTable } from "./components/funcionarios-table";

export default function FuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [funcionarioToEdit, setFuncionarioToEdit] = useState<Funcionario | null>(null);
  const [idToToggle, setIdToToggle] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe: Unsubscribe = subscribeToFuncionarios((data) => {
      setFuncionarios(data);
      setIsLoading(false);
    }, showInactive);
    return () => unsubscribe();
  }, [showInactive]);

  const handleExpansionChange: OnChangeFn<ExpandedState> = (updater) => {
    const oldExpanded = expanded;
    const newExpanded = typeof updater === 'function' ? updater(oldExpanded) : updater;

    // Lógica para permitir apenas uma linha expandida por vez
    if (Object.keys(newExpanded).length > 1) {
      const lastKey = Object.keys(newExpanded).find(key => !oldExpanded.hasOwnProperty(key));
      setExpanded(lastKey ? { [lastKey]: true } : {});
    } else {
      setExpanded(newExpanded);
    }
  };

  const handleNew = () => {
    setFuncionarioToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (funcionario: Funcionario) => {
    setFuncionarioToEdit(funcionario);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setIdToToggle(id);
    setIsConfirmOpen(true);
  };

  const confirmStatusToggle = async () => {
    if (!idToToggle) return;
    const funcionario = funcionarios.find(f => f.id === idToToggle);
    if (!funcionario) return;

    const newStatus = funcionario.status === "ativo" ? "inativo" : "ativo";
    const actionText = newStatus === "inativo" ? "inativado" : "reativado";

    try {
      await setFuncionarioStatus(idToToggle, newStatus);
      toast.success(`Funcionário ${actionText} com sucesso!`);
    } catch (e: any) {
      toast.error(`Erro ao ${actionText} o funcionário.`, { description: e.message });
    } finally {
      setIdToToggle(null);
      setIsConfirmOpen(false);
    }
  };

  const funcionarioToToggle = funcionarios.find(f => f.id === idToToggle);
  const isTogglingToInactive = funcionarioToToggle?.status === 'ativo';

  return (
    <>
      <ConfirmationDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={confirmStatusToggle}
        title={isTogglingToInactive ? "Confirmar Inativação" : "Confirmar Reativação"}
        description={`Você tem certeza que deseja ${isTogglingToInactive ? 'inativar' : 'reativar'} este funcionário?`}
      />
      <FuncionarioForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        funcionarioToEdit={funcionarioToEdit}
      />
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <FuncionariosActions
          onNew={handleNew}
          showInactive={showInactive}
          onShowInactiveChange={setShowInactive}
        />
        <FuncionariosTable
          funcionarios={funcionarios}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onReactivate={handleDelete}
          expanded={expanded}
          onExpandedChange={handleExpansionChange}
        />
      </motion.div>
    </>
  );
}
