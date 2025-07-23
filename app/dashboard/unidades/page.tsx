"use client";

import { useState, useEffect } from "react";
import { Unsubscribe } from "firebase/firestore";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Unidade } from "@/lib/schemas";
import {
  subscribeToUnidades,
  deleteUnidade,
} from "@/lib/services/unidades.services";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { UnidadeForm } from "./components/unidade-form";
import { UnidadesActions } from "./components/unidade-actions";
import { UnidadesTable } from "./components/unidade-table";

export default function UnidadesPage() {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [unidadeToEdit, setUnidadeToEdit] = useState<Unidade | null>(null);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe: Unsubscribe = subscribeToUnidades((data) => {
      setUnidades(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleNew = () => {
    setUnidadeToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (unidade: Unidade) => {
    setUnidadeToEdit(unidade);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setIdToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!idToDelete) return;
    try {
      await deleteUnidade(idToDelete);
      toast.success("Unidade excluída com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao excluir unidade.", { description: "Verifique se ela não está sendo usada em algum produto." });
    } finally {
      setIdToDelete(null);
      setIsConfirmOpen(false);
    }
  };

  return (
    <>
      <ConfirmationDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        description="Você tem certeza que deseja excluir esta unidade? Esta ação não pode ser desfeita."
      />
      <UnidadeForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        unidadeToEdit={unidadeToEdit}
      />
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <UnidadesActions onNew={handleNew} />
        <UnidadesTable
          unidades={unidades}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </motion.div>
    </>
  );
}
