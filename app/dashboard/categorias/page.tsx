"use client";

import { useState, useEffect } from "react";
import { Unsubscribe } from "firebase/firestore";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Categoria } from "@/lib/schemas";
import {
  subscribeToCategorias,
  setCategoriaStatus,
} from "@/lib/services/categorias.services";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { CategoriasActions } from "./components/categorias-actions";
import { CategoriasTable } from "./components/categorias-table";
import { CategoriaForm } from "./components/categorias-form";

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [categoriaToEdit, setCategoriaToEdit] = useState<Categoria | null>(null);
  const [idToToggle, setIdToToggle] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe: Unsubscribe = subscribeToCategorias((data) => {
      setCategorias(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleNew = () => {
    setCategoriaToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (categoria: Categoria) => {
    setCategoriaToEdit(categoria);
    setIsFormOpen(true);
  };

  const handleToggle = (id: string) => {
    setIdToToggle(id);
    setIsConfirmOpen(true);
  };

  const confirmStatusToggle = async () => {
    if (!idToToggle) return;
    const categoria = categorias.find(c => c.id === idToToggle);
    if (!categoria) return;

    const newStatus = categoria.status === "ativo" ? "inativo" : "ativo";
    const actionText = newStatus === "inativo" ? "inativada" : "reativada";

    try {
      await setCategoriaStatus(idToToggle, newStatus);
      toast.success(`Categoria ${actionText} com sucesso!`);
    } catch (e: any) {
      toast.error(`Erro ao ${actionText} a categoria.`, { description: e.message });
    } finally {
      setIdToToggle(null);
      setIsConfirmOpen(false);
    }
  };

  const categoriaToToggle = categorias.find(c => c.id === idToToggle);
  const isTogglingToInactive = categoriaToToggle?.status === 'ativo';

  return (
    <>
      <ConfirmationDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={confirmStatusToggle}
        title={isTogglingToInactive ? "Confirmar Inativação" : "Confirmar Reativação"}
        description={`Você tem certeza que deseja ${isTogglingToInactive ? 'inativar' : 'reativar'} esta categoria?`}
      />
      <CategoriaForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        categoriaToEdit={categoriaToEdit}
      />
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <CategoriasActions onNew={handleNew} />
        <CategoriasTable
          categorias={categorias}
          isLoading={isLoading}
          onEdit={handleEdit}
          onToggle={handleToggle}
        />
      </motion.div>
    </>
  );
}
