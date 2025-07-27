'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Abate, Fornecedor } from '@/lib/schemas';
import { subscribeToAbates, setAbateStatus } from '@/lib/services/abates.services';
import { ExpandedState } from '@tanstack/react-table';
import { DependencyAlert } from '@/components/dependency-alert';
import { AbateForm } from './components/abate-form';
import { AbatesActions } from './components/abate-actions';
import { AbateTable } from './components/abate-table';
import { useDataStore } from '@/store/data.store';


export default function AbatesPage() {
  const [abates, setAbates] = useState<Abate[]>([]);
  const [filteredAbates, setFilteredAbates] = useState<Abate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [showInactive, setShowInactive] = useState(false);

  const [isDependencyAlertOpen, setIsDependencyAlertOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [abateToEdit, setAbateToEdit] = useState<Abate | null>(null);

  const { fornecedores } = useDataStore();

  useEffect(() => {
    const unsubscribe = subscribeToAbates((data) => {
      setAbates(data);
    }, true); // Sempre busca todos para filtrar localmente
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredBySearch = abates.filter(item => {
        const fornecedor = fornecedores.find(f => f.id === item.fornecedorId);
        return (
          item.loteId?.toLowerCase().includes(lowercasedFilter) ||
          fornecedor?.nomeRazaoSocial.toLowerCase().includes(lowercasedFilter) ||
          searchTerm === ''
        )
    });

    const filteredByStatus = showInactive
      ? filteredBySearch
      : filteredBySearch.filter(item => item.status !== 'Cancelado');

    setFilteredAbates(filteredByStatus);
  }, [searchTerm, abates, fornecedores, showInactive]);

  const handleAddNew = () => {
    if (fornecedores.filter(f => f.status === 'ativo').length === 0) {
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
    toast.promise(setAbateStatus(id, 'Cancelado'), {
      loading: 'Cancelando abate...',
      success: 'Abate cancelado com sucesso!',
      error: 'Erro ao cancelar o abate.',
    });
  };

  const handleReactivate = (id: string) => {
     toast.error("A reativação de um lote cancelado não é permitida.");
  };

  return (
    <>
      <DependencyAlert
        isOpen={isDependencyAlertOpen}
        onOpenChange={setIsDependencyAlertOpen}
        dependencies={[
            { name: 'Fornecedores Ativos', link: '/dashboard/fornecedores' }
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
            fornecedores={fornecedores}
            isLoading={false}
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
