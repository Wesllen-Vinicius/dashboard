'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/hooks/use-data';
import { toast } from 'sonner';
import { Abate, Compra, Funcionario } from '@/lib/schemas';
import { subscribeToAbates, setAbateStatus } from '@/lib/services/abates.services';
import { ExpandedState } from '@tanstack/react-table';
import { DependencyAlert } from '@/components/dependency-alert';
import { AbateForm } from './components/abate-form';
import { AbatesActions } from './components/abate-actions';
import { AbateTable } from './components/abate-table';


export default function AbatesPage() {
  const [abates, setAbates] = useState<Abate[]>([]);
  const [filteredAbates, setFilteredAbates] = useState<Abate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [showInactive, setShowInactive] = useState(false);

  const [isDependencyAlertOpen, setIsDependencyAlertOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [abateToEdit, setAbateToEdit] = useState<Abate | null>(null);

  const { data: compras, loading: loadingCompras, error: errorCompras } = useData<Compra>('compras', false);
  const { data: funcionarios, loading: loadingFuncionarios, error: errorFuncionarios } = useData<Funcionario>('funcionarios', false);

  useEffect(() => {
    const unsubscribe = subscribeToAbates(setAbates, showInactive);
    return () => unsubscribe();
  }, [showInactive]);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered = abates.filter(item => {
        const compra = compras.find(c => c.id === item.compraId);
        return compra?.notaFiscal.toLowerCase().includes(lowercasedFilter) || searchTerm === '';
    });
    setFilteredAbates(filtered);
  }, [searchTerm, abates, compras]);

  const handleAddNew = () => {
    if (compras.filter(c => c.status === 'ativo').length === 0 || funcionarios.filter(f => f.status === 'ativo').length === 0) {
      setIsDependencyAlertOpen(true);
      return;
    }
    setAbateToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (abate: Abate) => {
    setAbateToEdit(abate);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    toast.promise(setAbateStatus(id, 'inativo'), {
      loading: 'Inativando abate...',
      success: 'Abate inativado com sucesso!',
      error: 'Erro ao inativar o abate.',
    });
  };

  const handleReactivate = (id: string) => {
    toast.promise(setAbateStatus(id, 'ativo'), {
      loading: 'Reativando abate...',
      success: 'Abate reativado com sucesso!',
      error: 'Erro ao reativar o abate.',
    });
  };

  const isLoading = loadingCompras || loadingFuncionarios;
  const hasError = errorCompras || errorFuncionarios;

  return (
    <>
      <DependencyAlert
        isOpen={isDependencyAlertOpen}
        onOpenChange={setIsDependencyAlertOpen}
        dependencies={[
            { name: 'Compras Ativas', link: '/dashboard/compras' },
            { name: 'Funcionários Ativos', link: '/dashboard/funcionarios' }
        ]}
      />
      <AbateForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        abateToEdit={abateToEdit}
      />
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <AbatesActions
          onAdd={handleAddNew}
          onSearch={setSearchTerm}
          showInactive={showInactive}
          onShowInactiveChange={setShowInactive}
        />

        <AbateTable
            abates={filteredAbates}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReactivate={handleReactivate}
            expanded={expanded}
            onExpandedChange={setExpanded}
          />
      </motion.div>
    </>
  );
}
