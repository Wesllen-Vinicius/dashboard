"use client";

import { useState, useEffect } from "react";
import { Unsubscribe } from "firebase/firestore";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ExpandedState, OnChangeFn } from "@tanstack/react-table";
import { Cargo } from "@/lib/schemas";
import { subscribeToCargos, setCargoStatus } from "@/lib/services/cargos.services";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { CargoActions } from "./components/cargo-actions";
import { CargoForm } from "./components/cargo-form";
import { CargoTable } from "./components/cargo-table";

export default function CargosPage() {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [cargoToEdit, setCargoToEdit] = useState<Cargo | null>(null);
  const [cargoIdToDelete, setCargoIdToDelete] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe: Unsubscribe = subscribeToCargos((data) => {
      setCargos(data);
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

  const handleNew = () => { setCargoToEdit(null); setIsFormOpen(true); };
  const handleEdit = (cargo: Cargo) => { setCargoToEdit(cargo); setIsFormOpen(true); };
  const handleDelete = (id: string) => { setCargoIdToDelete(id); setIsConfirmOpen(true); };

  const confirmDeletion = async () => {
    if (!cargoIdToDelete) return;
    try { await setCargoStatus(cargoIdToDelete, 'inativo'); toast.success("Cargo inativado com sucesso!");
    } catch (e: any) { toast.error("Erro ao inativar.", { description: e.message });
    } finally { setCargoIdToDelete(null); setIsConfirmOpen(false); }
  };

  const handleReactivate = async (id: string) => {
    try { await setCargoStatus(id, 'ativo'); toast.success("Cargo reativado com sucesso!");
    } catch (e: any) { toast.error("Erro ao reativar.", { description: e.message }); }
  };

  return (
    <>
      <ConfirmationDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen} onConfirm={confirmDeletion} title="Confirmar Inativação" description="Este cargo será inativado, mas poderá ser reativado depois." />
      <CargoForm isOpen={isFormOpen} onOpenChange={setIsFormOpen} cargoToEdit={cargoToEdit} />
      <motion.div className="space-y-6" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <CargoActions onNewCargo={handleNew} showInactive={showAll} onShowInactiveChange={setShowAll} />
        <CargoTable cargos={cargos} isLoading={isLoading} onEdit={handleEdit} onDelete={handleDelete} onReactivate={handleReactivate} expanded={expanded} onExpandedChange={handleExpansionChange} />
      </motion.div>
    </>
  );
}
