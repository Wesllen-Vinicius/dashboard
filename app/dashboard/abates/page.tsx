"use client";

import { useState, useEffect, useMemo } from "react"; // 1. Adicionado useMemo
import { Unsubscribe } from "firebase/firestore";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { useDataStore } from "@/store/data.store"; // 2. Importado o data store
import { Abate } from "@/lib/schemas";
import { subscribeToAbatesByDateRange, setAbateStatus } from "@/lib/services/abates.services";

import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { DependencyAlert } from "@/components/dependency-alert"; // 3. Importado o componente de alerta
import { AbateStatsCards } from "./components/abate-stats-cards";
import { AbateActions } from "./components/abate-actions";
import { AbateForm } from "./components/abate-form";
import { AbateTable } from "./components/abate-table";

export default function AbatesPage() {
  // 4. Obtendo os dados necessários do estado global
  const { funcionarios, compras } = useDataStore();
  const [abates, setAbates] = useState<Abate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Estados dos Modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDependencyAlertOpen, setIsDependencyAlertOpen] = useState(false); // 5. Novo estado

  const [abateToEdit, setAbateToEdit] = useState<Abate | null>(null);
  const [abateIdToDelete, setAbateIdToDelete] = useState<string | null>(null);

  // 6. Lógica para verificar as dependências
  const missingDependencies = useMemo(() => {
    const faltantes = [];
    if (funcionarios.length === 0) faltantes.push({ name: "Funcionários (Responsáveis)", link: "/dashboard/funcionarios" });
    if (compras.length === 0) faltantes.push({ name: "Compras de Gado", link: "/dashboard/compras" });
    return faltantes;
  }, [funcionarios, compras]);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe: Unsubscribe = subscribeToAbatesByDateRange(dateRange, (data) => {
      setAbates(data);
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
    });
    return () => unsubscribe();
  }, [dateRange]);

  // 7. Função de 'Novo Abate' atualizada com a verificação
  const handleNewAbate = () => {
    if (missingDependencies.length > 0) {
      setIsDependencyAlertOpen(true);
    } else {
      setAbateToEdit(null);
      setIsFormOpen(true);
    }
  };

  const handleEditAbate = (abate: Abate) => {
    setAbateToEdit(abate);
    setIsFormOpen(true);
  };

  const handleDeleteAbate = (id: string) => {
    setAbateIdToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDeletion = async () => {
    if (!abateIdToDelete) return;
    try {
      await setAbateStatus(abateIdToDelete, 'inativo');
      toast.success("Registro de abate inativado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao inativar o registro.", { description: error.message });
    } finally {
      setAbateIdToDelete(null);
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
        description="Esta ação é irreversível e irá inativar o lote de abate. Deseja continuar?"
      />
      {/* 8. Renderiza o alerta de dependências */}
      <DependencyAlert
        isOpen={isDependencyAlertOpen}
        onOpenChange={setIsDependencyAlertOpen}
        dependencies={missingDependencies}
      />

      {isFormOpen && (
        <AbateForm
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          abateToEdit={abateToEdit}
        />
      )}

      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <AbateActions
          dateRange={dateRange}
          onDateChange={setDateRange}
          onNewAbate={handleNewAbate}
        />
        <AbateStatsCards abates={abates} />
        <AbateTable
          abates={abates}
          isLoading={isLoading}
          onEdit={handleEditAbate}
          onDelete={handleDeleteAbate}
        />
      </motion.div>
    </>
  );
}
