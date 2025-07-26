"use client";

import { useState, useEffect } from "react";
import { Unsubscribe } from "firebase/firestore";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ExpandedState, OnChangeFn } from "@tanstack/react-table";
import { Fornecedor } from "@/lib/schemas";
import {
  subscribeToFornecedores,
  setFornecedorStatus,
} from "@/lib/services/fornecedores.services";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { FornecedoresStatsCards } from "./components/fornecedores-stats-cards";
import FornecedoresActions from "./components/fornecedores-actions";
import { FornecedoresForm } from "./components/fornecedores-form";
import { FornecedoresTable } from "./components/fornecedores-table";

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [fornecedorToEdit, setFornecedorToEdit] = useState<Fornecedor | null>(null);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe: Unsubscribe = subscribeToFornecedores((data) => {
      setFornecedores(data);
      setIsLoading(false);
    }, showInactive);
    return () => unsubscribe();
  }, [showInactive]);

  const handleExpansionChange: OnChangeFn<ExpandedState> = (updater) => {
    const oldExpanded = expanded;
    const newExpanded = typeof updater === "function" ? updater(oldExpanded) : updater;
    const oldKeys = Object.keys(oldExpanded);
    const newKeys = Object.keys(newExpanded);
    if (newKeys.length > 1) {
      const addedKey = newKeys.find((key) => !oldKeys.includes(key));
      if (addedKey) setExpanded({ [addedKey]: true });
      else setExpanded(newExpanded);
    } else {
      setExpanded(newExpanded);
    }
  };

  const handleNew = () => {
    setFornecedorToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setFornecedorToEdit(fornecedor);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setIdToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDeletion = async () => {
    if (!idToDelete) return;
    try {
      await setFornecedorStatus(idToDelete, "inativo");
      toast.success("Fornecedor inativado com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao inativar.", { description: e.message });
    } finally {
      setIdToDelete(null);
      setIsConfirmOpen(false);
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      await setFornecedorStatus(id, "ativo");
      toast.success("Fornecedor reativado com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao reativar.", { description: e.message });
    }
  };

  return (
    <>
      <ConfirmationDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={confirmDeletion}
        title="Confirmar Inativação"
        description="Este fornecedor será marcado como inativo e não aparecerá em novas operações."
      />
      <FornecedoresForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        fornecedorToEdit={fornecedorToEdit}
      />
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <FornecedoresActions
          onNew={handleNew}
          showInactive={showInactive}
          onShowInactiveChange={setShowInactive}
        />
        <FornecedoresStatsCards fornecedores={fornecedores} />
        <FornecedoresTable
          fornecedores={fornecedores}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onReactivate={handleReactivate}
          expanded={expanded}
          onExpandedChange={handleExpansionChange}
        />
      </motion.div>
    </>
  );
}
