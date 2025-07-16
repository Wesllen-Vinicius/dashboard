"use client";

import { useState, useEffect } from "react";
import { Unsubscribe } from "firebase/firestore";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ExpandedState, OnChangeFn } from "@tanstack/react-table";
import { Unidade } from "@/lib/schemas";
import { subscribeToUnidades, setUnidadeStatus } from "@/lib/services/unidades.services";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { UnidadeActions } from "./components/unidade-actions";
import { UnidadeForm } from "./components/unidade-form";
import { UnidadeTable } from "./components/unidade-table";

export default function UnidadesPage() {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [unidadeToEdit, setUnidadeToEdit] = useState<Unidade | null>(null);
  const [unidadeIdToDelete, setUnidadeIdToDelete] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe: Unsubscribe = subscribeToUnidades((data) => {
      setUnidades(data);
      setIsLoading(false);
    }, showAll);
    return () => unsubscribe();
  }, [showAll]);

  const handleExpansionChange: OnChangeFn<ExpandedState> = (updater) => {
    const oldExpanded = expanded;
    const newExpanded = typeof updater === 'function' ? updater(oldExpanded) : updater;
    const oldKeys = Object.keys(oldExpanded);
    const newKeys = Object.keys(newExpanded);
    if (newKeys.length > 1) {
      const addedKey = newKeys.find(key => !oldKeys.includes(key));
      if (addedKey) setExpanded({ [addedKey]: true });
      else setExpanded(newExpanded);
    } else {
      setExpanded(newExpanded);
    }
  };

  const handleNew = () => { setUnidadeToEdit(null); setIsFormOpen(true); };
  const handleEdit = (unidade: Unidade) => { setUnidadeToEdit(unidade); setIsFormOpen(true); };
  const handleDelete = (id: string) => { setUnidadeIdToDelete(id); setIsConfirmOpen(true); };

  const confirmDeletion = async () => {
    if (!unidadeIdToDelete) return;
    try { await setUnidadeStatus(unidadeIdToDelete, 'inativo'); toast.success("Unidade inativada com sucesso!");
    } catch (e: any) { toast.error("Erro ao inativar.", { description: e.message });
    } finally { setUnidadeIdToDelete(null); setIsConfirmOpen(false); }
  };

  const handleReactivate = async (id: string) => {
    try { await setUnidadeStatus(id, 'ativo'); toast.success("Unidade reativada com sucesso!");
    } catch (e: any) { toast.error("Erro ao reativar.", { description: e.message }); }
  };

  return (
    <>
      <ConfirmationDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen} onConfirm={confirmDeletion} title="Confirmar Inativação" description="Você tem certeza que deseja inativar esta unidade? Ela poderá ser reativada depois." />
      <UnidadeForm isOpen={isFormOpen} onOpenChange={setIsFormOpen} unidadeToEdit={unidadeToEdit} />
      <motion.div className="space-y-6" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <UnidadeActions onNew={handleNew} showInactive={showAll} onShowInactiveChange={setShowAll} />
        <UnidadeTable unidades={unidades} isLoading={isLoading} onEdit={handleEdit} onDelete={handleDelete} onReactivate={handleReactivate} expanded={expanded} onExpandedChange={handleExpansionChange} />
      </motion.div>
    </>
  );
}
