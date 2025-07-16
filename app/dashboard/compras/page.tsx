"use client";

import { useState, useEffect, useMemo } from "react"; // Adicionei useMemo
import { Unsubscribe } from "firebase/firestore";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { useDataStore } from "@/store/data.store"; // Importe a store
import { Compra } from "@/lib/schemas";
import { subscribeToComprasByDateRange, setCompraStatus } from "@/lib/services/compras.services";

import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { CompraStatsCards } from "./components/compra-stats-cards";
import { CompraActions } from "./components/compra-actions";
import { CompraForm } from "./components/compra-form";
import { CompraTable } from "./components/compra-table";
import { DependencyAlert } from "@/components/dependency-alert";


export default function ComprasPage() {
  const { fornecedores, produtos, contasBancarias } = useDataStore(); // 2. Obtenha os dados da store
  const [compras, setCompras] = useState<Compra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Estados dos Modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDependencyAlertOpen, setIsDependencyAlertOpen] = useState(false); // 3. Novo estado para o alerta

  // Dados para edição ou exclusão
  const [compraToEdit, setCompraToEdit] = useState<Compra | null>(null);
  const [compraIdToDelete, setCompraIdToDelete] = useState<string | null>(null);

  // 4. Lógica para verificar dependências
  const missingDependencies = useMemo(() => {
    const faltantes = [];
    if (fornecedores.length === 0) faltantes.push({ name: "Fornecedores", link: "/dashboard/fornecedores" });
    if (produtos.length === 0) faltantes.push({ name: "Produtos", link: "/dashboard/produtos" });
    if (contasBancarias.length === 0) faltantes.push({ name: "Contas Bancárias", link: "/dashboard/financeiro/contas-bancarias" });
    return faltantes;
  }, [fornecedores, produtos, contasBancarias]);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe: Unsubscribe = subscribeToComprasByDateRange(dateRange, (data) => {
      setCompras(data);
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
    });
    return () => unsubscribe();
  }, [dateRange]);

  // 5. Função de "Nova Compra" atualizada
  const handleNewCompra = () => {
    if (missingDependencies.length > 0) {
      setIsDependencyAlertOpen(true);
    } else {
      setCompraToEdit(null);
      setIsFormOpen(true);
    }
  };

  const handleEdit = (compra: Compra) => {
    setCompraToEdit(compra);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setCompraIdToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDeletion = async () => {
    if (!compraIdToDelete) return;
    try {
      await setCompraStatus(compraIdToDelete, 'inativo');
      toast.success("Compra inativada com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao inativar a compra.", { description: error.message });
    } finally {
      setCompraIdToDelete(null);
      setIsConfirmOpen(false);
    }
  };

  return (
    <>
      <ConfirmationDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={confirmDeletion}
        title="Confirmar Inativação"
        description="Esta ação é irreversível e irá inativar o registro desta compra. Deseja continuar?"
      />
      {/* 6. Renderiza o alerta de dependências */}
      <DependencyAlert
        isOpen={isDependencyAlertOpen}
        onOpenChange={setIsDependencyAlertOpen}
        dependencies={missingDependencies}
      />

      {isFormOpen && (
        <CompraForm
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          compraToEdit={compraToEdit}
        />
      )}

      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <CompraActions
          dateRange={dateRange}
          onDateChange={setDateRange}
          onNewCompra={handleNewCompra}
        />
        <CompraStatsCards compras={compras} />
        <CompraTable
          compras={compras}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </motion.div>
    </>
  );
}
