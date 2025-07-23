"use client";

import { useState, useEffect } from "react";
import { Unsubscribe } from "firebase/firestore";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Cargo } from "@/lib/schemas";
import {
  subscribeToCargos,
  setCargoStatus,
} from "@/lib/services/cargos.services";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { CargoForm } from "./components/cargo-form";
import { CargosActions } from "./components/cargo-actions";
import { CargosTable } from "./components/cargo-table";


export default function CargosPage() {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [cargoToEdit, setCargoToEdit] = useState<Cargo | null>(null);
  const [idToToggle, setIdToToggle] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe: Unsubscribe = subscribeToCargos((data) => {
      setCargos(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleNew = () => {
    setCargoToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (cargo: Cargo) => {
    setCargoToEdit(cargo);
    setIsFormOpen(true);
  };

  const handleToggle = (id: string) => {
    setIdToToggle(id);
    setIsConfirmOpen(true);
  };

  const confirmStatusToggle = async () => {
    if (!idToToggle) return;
    const cargo = cargos.find(c => c.id === idToToggle);
    if (!cargo) return;

    const newStatus = cargo.status === "ativo" ? "inativo" : "ativo";
    const actionText = newStatus === "inativo" ? "inativado" : "reativado";

    try {
      await setCargoStatus(idToToggle, newStatus);
      toast.success(`Cargo ${actionText} com sucesso!`);
    } catch (e: any) {
      toast.error(`Erro ao ${actionText} o cargo.`, { description: e.message });
    } finally {
      setIdToToggle(null);
      setIsConfirmOpen(false);
    }
  };

  const cargoToToggle = cargos.find(c => c.id === idToToggle);
  const isTogglingToInactive = cargoToToggle?.status === 'ativo';

  return (
    <>
      <ConfirmationDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={confirmStatusToggle}
        title={isTogglingToInactive ? "Confirmar Inativação" : "Confirmar Reativação"}
        description={`Você tem certeza que deseja ${isTogglingToInactive ? 'inativar' : 'reativar'} este cargo?`}
      />
      <CargoForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        cargoToEdit={cargoToEdit}
      />
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <CargosActions onNew={handleNew} />
        <CargosTable
          cargos={cargos}
          isLoading={isLoading}
          onEdit={handleEdit}
          onToggle={handleToggle}
        />
      </motion.div>
    </>
  );
}
