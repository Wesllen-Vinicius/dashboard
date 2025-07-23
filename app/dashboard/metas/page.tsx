"use client";

import { useState, useEffect, useMemo } from "react";
import { Unsubscribe } from "firebase/firestore";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Meta, Produto } from "@/lib/schemas";
import { useData } from "@/hooks/use-data";
import { subscribeToMetas, setMetaStatus } from "@/lib/services/metas.services";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { DependencyAlert } from "@/components/dependency-alert";
import { MetasActions } from "./components/metas-actions";
import { MetaForm } from "./components/meta-form";
import { MetasTable } from "./components/metas-table";

export default function MetasPage() {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [metaToEdit, setMetaToEdit] = useState<Meta | null>(null);
  const [idToToggle, setIdToToggle] = useState<string | null>(null);
  const [isDependencyAlertOpen, setIsDependencyAlertOpen] = useState(false);

  // Carrega apenas os produtos de venda ativos, que são a dependência deste módulo.
  const { data: produtos, loading: loadingProdutos } = useData<Produto>('produtos');
  const produtosDeVenda = useMemo(() => produtos.filter(p => p.tipoProduto === 'VENDA'), [produtos]);

  useEffect(() => {
    // A busca de metas só começa depois que os produtos (dependência) forem carregados.
    if (!loadingProdutos) {
      const unsubscribe: Unsubscribe = subscribeToMetas((data) => {
        setMetas(data);
        setIsLoading(false);
      });
      return () => unsubscribe();
    }
  }, [loadingProdutos]);

  const handleNew = () => {
    // REGRA DE NEGÓCIO APRIMORADA:
    // Verifica se existe pelo menos um produto de venda ativo antes de abrir o formulário.
    if (produtosDeVenda.length === 0) {
      setIsDependencyAlertOpen(true);
      return;
    }
    setMetaToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (meta: Meta) => {
    setMetaToEdit(meta);
    setIsFormOpen(true);
  };

  const handleToggle = (id: string) => {
    setIdToToggle(id);
    setIsConfirmOpen(true);
  };

  const confirmStatusToggle = async () => {
    if (!idToToggle) return;
    const meta = metas.find(m => m.id === idToToggle);
    if (!meta) return;

    const newStatus = meta.status === "ativo" ? "inativo" : "ativo";
    const actionText = newStatus === "inativo" ? "inativada" : "reativada";

    try {
      await setMetaStatus(idToToggle, newStatus);
      toast.success(`Meta ${actionText} com sucesso!`);
    } catch (e: any) {
      toast.error(`Erro ao ${actionText} a meta.`, { description: e.message });
    } finally {
      setIdToToggle(null);
      setIsConfirmOpen(false);
    }
  };

  const metaToToggle = metas.find(m => m.id === idToToggle);
  const isTogglingToInactive = metaToToggle?.status === 'ativo';

  return (
    <>
      <ConfirmationDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={confirmStatusToggle}
        title={isTogglingToInactive ? "Confirmar Inativação" : "Confirmar Reativação"}
        description={`Você tem certeza que deseja ${isTogglingToInactive ? 'inativar' : 'reativar'} esta meta?`}
      />
      <DependencyAlert
        isOpen={isDependencyAlertOpen}
        onOpenChange={setIsDependencyAlertOpen}
        dependencies={[{ name: 'Produtos de Venda', link: '/dashboard/produtos' }]}
      />
      <MetaForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        metaToEdit={metaToEdit}
        produtosDeVenda={produtosDeVenda}
      />
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <MetasActions onNew={handleNew} />
        <MetasTable
          metas={metas}
          isLoading={isLoading || loadingProdutos}
          onEdit={handleEdit}
          onToggle={handleToggle}
        />
      </motion.div>
    </>
  );
}
