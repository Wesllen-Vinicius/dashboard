"use client";

import { useState, useEffect, useMemo } from "react";
import { Unsubscribe } from "firebase/firestore";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ExpandedState, OnChangeFn } from "@tanstack/react-table";
import { Categoria, Produto, Unidade } from "@/lib/schemas";
import { useData } from "@/hooks/use-data";
import { subscribeToProdutos, setProdutoStatus } from "@/lib/services/produtos.services";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { DependencyAlert } from "@/components/dependency-alert";
import { ProdutosActions } from "./components/produtos-actions";
import { ProdutosTable } from "./components/produtos-table";
import { ProdutoForm } from "./components/produtos-form";
import { ProdutosStatsCards } from "./components/produtos-stats-cards";

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [produtoToEdit, setProdutoToEdit] = useState<Produto | null>(null);
  const [idToToggle, setIdToToggle] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [isDependencyAlertOpen, setIsDependencyAlertOpen] = useState(false);

  const { data: unidades, loading: loadingUnidades } = useData<Unidade>('unidades');
  const { data: categorias, loading: loadingCategorias } = useData<Categoria>('categorias');

  useEffect(() => {
    if (!loadingUnidades && !loadingCategorias) {
      const unsubscribe: Unsubscribe = subscribeToProdutos((data) => {
        setProdutos(data);
        setIsLoading(false);
      });
      return () => unsubscribe();
    }
  }, [loadingUnidades, loadingCategorias]);

  const handleNew = () => {
    if (unidades.length === 0 || categorias.length === 0) {
      setIsDependencyAlertOpen(true);
      return;
    }
    setProdutoToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (produto: Produto) => {
    setProdutoToEdit(produto);
    setIsFormOpen(true);
  };

  const handleToggle = (id: string) => {
    setIdToToggle(id);
    setIsConfirmOpen(true);
  };

  const confirmStatusToggle = async () => {
    if (!idToToggle) return;
    const produto = produtos.find(p => p.id === idToToggle);
    if (!produto) return;
    const newStatus = produto.status === "ativo" ? "inativo" : "ativo";
    const actionText = newStatus === "inativo" ? "inativado" : "reativado";
    try {
      await setProdutoStatus(idToToggle, newStatus);
      toast.success(`Produto ${actionText} com sucesso!`);
    } catch (e: any) {
      toast.error(`Erro ao ${actionText} o produto.`, { description: e.message });
    } finally {
      setIdToToggle(null);
      setIsConfirmOpen(false);
    }
  };

  const handleExpansionChange: OnChangeFn<ExpandedState> = (updater) => {
    setExpanded(updater);
  };

  const produtoToToggle = produtos.find(p => p.id === idToToggle);
  const isTogglingToInactive = produtoToToggle?.status === 'ativo';

  return (
    <>
      <ConfirmationDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={confirmStatusToggle}
        title={isTogglingToInactive ? "Confirmar Inativação" : "Confirmar Reativação"}
        description={`Você tem certeza que deseja ${isTogglingToInactive ? 'inativar' : 'reativar'} este produto?`}
      />
      <DependencyAlert
        isOpen={isDependencyAlertOpen}
        onOpenChange={setIsDependencyAlertOpen}
        dependencies={[
            { name: 'Unidades de Medida', link: '/dashboard/unidades' },
            { name: 'Categorias', link: '/dashboard/categorias' }
        ]}
      />
      <ProdutoForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        produtoToEdit={produtoToEdit}
      />
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ProdutosActions onNew={handleNew} />

        {/* Card de Stats Adicionado Aqui */}
        <ProdutosStatsCards produtos={produtos} />

        <ProdutosTable
          produtos={produtos}
          isLoading={isLoading || loadingUnidades || loadingCategorias}
          onEdit={handleEdit}
          onToggle={handleToggle}
          expanded={expanded}
          onExpandedChange={handleExpansionChange}
        />
      </motion.div>
    </>
  );
}
