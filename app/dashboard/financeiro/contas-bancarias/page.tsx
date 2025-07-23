"use client";

import { useState, useEffect } from "react";
import { Unsubscribe } from "firebase/firestore";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ContaBancaria } from "@/lib/schemas";
import {
  subscribeToContasBancarias,
  setContaBancariaStatus,
} from "@/lib/services/contasBancarias.services";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { ContasBancariasActions } from "./components/contas-bancarias-actions";
import { ContasBancariasForm } from "./components/contas-bancarias-form";
import { ContasBancariasTable } from "./components/contas-bancarias-table";

export default function ContasBancariasPage() {
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [contaToEdit, setContaToEdit] = useState<ContaBancaria | null>(null);
  const [idToToggle, setIdToToggle] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe: Unsubscribe = subscribeToContasBancarias((data) => {
      setContas(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleNew = () => {
    setContaToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (conta: ContaBancaria) => {
    setContaToEdit(conta);
    setIsFormOpen(true);
  };

  const handleToggle = (id: string) => {
    setIdToToggle(id);
    setIsConfirmOpen(true);
  };

  const confirmStatusToggle = async () => {
    if (!idToToggle) return;
    const conta = contas.find(c => c.id === idToToggle);
    if (!conta) return;

    const newStatus = conta.status === "ativa" ? "inativa" : "ativa";
    const actionText = newStatus === "inativa" ? "inativada" : "reativada";

    try {
      await setContaBancariaStatus(idToToggle, newStatus);
      toast.success(`Conta ${actionText} com sucesso!`);
    } catch (e: any) {
      toast.error(`Erro ao ${actionText} a conta.`, { description: e.message });
    } finally {
      setIdToToggle(null);
      setIsConfirmOpen(false);
    }
  };

  const contaToToggle = contas.find(c => c.id === idToToggle);
  const isTogglingToInactive = contaToToggle?.status === 'ativa';

  return (
    <>
      <ConfirmationDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={confirmStatusToggle}
        title={isTogglingToInactive ? "Confirmar Inativação" : "Confirmar Reativação"}
        description={`Você tem certeza que deseja ${isTogglingToInactive ? 'inativar' : 'reativar'} esta conta bancária?`}
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
        <ContasBancariasActions onNew={handleNew} />
        <ContasBancariasTable
          contas={contas}
          isLoading={isLoading}
          onEdit={handleEdit}
          onToggle={handleToggle}
        />
      </motion.div>
    </>
  );
}
