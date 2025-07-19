"use client";

import { useState, useEffect } from "react";
import { Unsubscribe } from "firebase/firestore";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ExpandedState, OnChangeFn } from "@tanstack/react-table";
import { Cliente } from "@/lib/schemas";
import {
  subscribeToClientes,
  setClienteStatus,
} from "@/lib/services/clientes.services";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { ClientesForm } from "./components/clientes-form";
import ClientesActions from "./components/clientes-actions";
import { ClientesStatsCards } from "./components/clientes-stats-cards";
import { ClientesTable } from "./components/clientes-table";


export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [clienteToEdit, setClienteToEdit] = useState<Cliente | null>(null);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe: Unsubscribe = subscribeToClientes((data) => {
      setClientes(data);
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
    setClienteToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (cliente: Cliente) => {
    setClienteToEdit(cliente);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setIdToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDeletion = async () => {
    if (!idToDelete) return;
    try {
      await setClienteStatus(idToDelete, "inativo");
      toast.success("Cliente inativado com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao inativar.", { description: e.message });
    } finally {
      setIdToDelete(null);
      setIsConfirmOpen(false);
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      await setClienteStatus(id, "ativo");
      toast.success("Cliente reativado com sucesso!");
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
        description="Este cliente será marcado como inativo e não aparecerá em novas operações."
      />
      <ClientesForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        clienteToEdit={clienteToEdit}
      />
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ClientesActions
          onNew={handleNew}
          showInactive={showInactive}
          onShowInactiveChange={setShowInactive}
        />
        <ClientesStatsCards clientes={clientes} />
        <ClientesTable
          clientes={clientes}
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
