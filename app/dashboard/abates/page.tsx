'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

import { Abate } from '@/lib/schemas';
import { subscribeToAbates, setAbateStatus } from '@/lib/services/abates.services';
import { ExpandedState } from '@tanstack/react-table';

import { DependencyAlert } from '@/components/dependency-alert';
import { useDataStore } from '@/store/data.store';

import { AbateForm } from './components/abate-form';
import { AbatesActions } from './components/abate-actions';
import { AbateStatsCards } from './components/abate-stats-cards';

import { AbateTable } from './components/abate-table';
import { AnaliseAbateCard } from './components/analise-abate-card';

export default function AbatesPage() {
  const [abates, setAbates] = useState<Abate[]>([]);
  const [filteredAbates, setFilteredAbates] = useState<Abate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [showInactive, setShowInactive] = useState(false);

  const [isDependencyAlertOpen, setIsDependencyAlertOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [abateToEdit, setAbateToEdit] = useState<Abate | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const { fornecedores } = useDataStore();

  // Subscribe to abates
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToAbates((data: Abate[]) => {
      setAbates(data);
      setIsLoading(false);
    }, true);
    return () => unsubscribe();
  }, []);

  // Filter by search and status
  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    const bySearch = abates.filter(a => {
      const forn = fornecedores.find(f => f.id === a.fornecedorId);
      return (
        (!!a.loteId && a.loteId.toLowerCase().includes(lower)) ||
        !!forn?.nomeRazaoSocial.toLowerCase().includes(lower) ||
        searchTerm === ''
      );
    });
    const byStatus = showInactive
      ? bySearch
      : bySearch.filter(a => a.status !== 'Cancelado');
    setFilteredAbates(byStatus);
  }, [searchTerm, abates, fornecedores, showInactive]);

  const handleAddNew = () => {
    if (!fornecedores.some(f => f.status === 'ativo')) {
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

  const handleReactivate = (_id: string) => {
    toast.error('A reativação de um lote cancelado não é permitida.');
  };

  return (
    <>
      <DependencyAlert
        isOpen={isDependencyAlertOpen}
        onOpenChange={setIsDependencyAlertOpen}
        dependencies={[{ name: 'Fornecedores Ativos', link: '/dashboard/fornecedores' }]}
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
        {/* Actions (search, add) */}
        <AbatesActions
          onAdd={handleAddNew}
          onSearch={setSearchTerm}
          showInactive={showInactive}
          onShowInactiveChange={setShowInactive}
        />

        {/* Monthly stats cards */}
        <AbateStatsCards abates={abates} />

        {/* Carcass yield analysis */}
        <AnaliseAbateCard />

        {/* The main table */}
        <AbateTable
          abates={filteredAbates}
          fornecedores={fornecedores}
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
