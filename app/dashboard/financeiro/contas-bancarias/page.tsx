"use client";

import { useState, useEffect } from "react";
import { Unsubscribe } from "firebase/firestore";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ExpandedState, OnChangeFn } from "@tanstack/react-table";
import { ContaBancaria } from "@/lib/schemas";
import {
  subscribeToContasBancarias,
  setContaBancariaStatus,
} from "@/lib/services/contasBancarias.services";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { ContasBancariasForm } from "./components/contas-bancarias-form";
import ContasBancariasActions from "./components/contas-bancarias-actions";
import { ContasBancariasTable } from "./components/contas-bancarias-table";


export default function ContasBancariasPage() {
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [contaToEdit, setContaToEdit] = useState<ContaBancaria | null>(null);
  const [contaIdToDelete, setContaIdToDelete] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe: Unsubscribe = subscribeToContasBancarias((data) => {
      setContas(data);
      setIsLoading(false);
    }, showInactive);
    return () => unsubscribe();
  }, [showInactive]);

  const handleExpansionChange: OnChangeFn<ExpandedState> = (updater) => {
    const oldExpanded = expanded;
    const newExpanded =
      typeof updater === "function" ? updater(oldExpanded) : updater;
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
    setContaToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (conta: ContaBancaria) => {
    setContaToEdit(conta);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setContaIdToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDeletion = async () => {
    if (!contaIdToDelete) return;
    try {
      await setContaBancariaStatus(contaIdToDelete, "inativa");
      toast.success("Conta inativada com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao inativar.", { description: e.message });
    } finally {
      setContaIdToDelete(null);
      setIsConfirmOpen(false);
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      await setContaBancariaStatus(id, "ativa");
      toast.success("Conta reativada com sucesso!");
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
        description="Esta conta será inativada, mas poderá ser reativada depois. Nenhuma transação será excluída."
      />
      <ContasBancariasForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        contaToEdit={contaToEdit}
      />
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ContasBancariasActions
          onNew={handleNew}
          showInactive={showInactive}
          onShowInactiveChange={setShowInactive}
        />
        <ContasBancariasTable
          contas={contas}
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
