"use client";

import { useState, useEffect } from "react";
import { Unsubscribe } from "firebase/firestore";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ExpandedState, OnChangeFn } from "@tanstack/react-table";
import { Categoria } from "@/lib/schemas";
import {
  subscribeToCategorias,
  setCategoriaStatus,
} from "@/lib/services/categorias.services";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import CategoriasActions from "./components/categorias-actions";
import { CategoriaForm } from "./components/categorias-form";
import { CategoriasTable } from "./components/categorias-table";

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [categoriaToEdit, setCategoriaToEdit] = useState<Categoria | null>(null);
  const [categoriaIdToDelete, setCategoriaIdToDelete] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe: Unsubscribe = subscribeToCategorias((data) => {
      setCategorias(data);
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
    setCategoriaToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (categoria: Categoria) => {
    setCategoriaToEdit(categoria);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setCategoriaIdToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDeletion = async () => {
    if (!categoriaIdToDelete) return;
    try {
      await setCategoriaStatus(categoriaIdToDelete, "inativo");
      toast.success("Categoria inativada com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao inativar.", { description: e.message });
    } finally {
      setCategoriaIdToDelete(null);
      setIsConfirmOpen(false);
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      await setCategoriaStatus(id, "ativo");
      toast.success("Categoria reativada com sucesso!");
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
        description="Esta categoria será inativada, mas poderá ser reativada depois."
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
        <CategoriasActions
          onNew={handleNew}
          showInactive={showInactive}
          onShowInactiveChange={setShowInactive}
        />
        <CategoriasTable
          categorias={categorias}
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
