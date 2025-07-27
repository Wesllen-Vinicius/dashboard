'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useDataStore } from '@/store/data.store';
import { Producao } from '@/lib/schemas';
import {
  subscribeToProducoes,
  setProducaoStatus,
} from '@/lib/services/producao.services';
import { ExpandedState } from '@tanstack/react-table';
import { ProducaoActions } from './components/producao-actions';
import { ProducaoTable } from './components/producao-table';
import { ProducaoForm } from './components/producao-form';
import { DependencyAlert } from '@/components/dependency-alert';
import { ProducaoStatsCards } from './components/producao-stats-cards';

export default function ProducaoPage() {
  const [producoes, setProducoes] = useState<Producao[]>([]);
  const [filteredProducoes, setFilteredProducoes] = useState<Producao[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [showInactive, setShowInactive] = useState(false);

  const [isDependencyAlertOpen, setIsDependencyAlertOpen] = useState(false);
  const [missingDependencies, setMissingDependencies] = useState<
    { name: string; link: string }[]
  >([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [producaoToEdit, setProducaoToEdit] = useState<Producao | null>(
    null
  );

  const { funcionarios, abates, produtos, unidades } = useDataStore();

  useEffect(() => {
    const unsubscribe = subscribeToProducoes(setProducoes, showInactive);
    return () => unsubscribe();
  }, [showInactive]);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered = producoes.filter(
      (item) =>
        item.lote?.toLowerCase().includes(lowercasedFilter) ||
        searchTerm === ''
    );
    setFilteredProducoes(filtered);
  }, [searchTerm, producoes]);

  const handleAddNew = () => {
    const dependenciesFaltantes: { name: string; link: string }[] = [];

    const abatesDisponiveis = abates.filter(
      (a) =>
        a.status === 'Aguardando Processamento' ||
        a.status === 'Em Processamento'
    );
    if (abatesDisponiveis.length === 0) {
      dependenciesFaltantes.push({
        name: 'Abates Ativos',
        link: '/dashboard/abates',
      });
    }

    if (funcionarios.filter((f) => f.status === 'ativo').length === 0) {
      dependenciesFaltantes.push({
        name: 'Funcionários Ativos',
        link: '/dashboard/funcionarios',
      });
    }
    if (produtos.filter((p) => p.status === 'ativo').length === 0) {
      dependenciesFaltantes.push({
        name: 'Produtos Ativos',
        link: '/dashboard/produtos',
      });
    }

    if (dependenciesFaltantes.length > 0) {
      setMissingDependencies(dependenciesFaltantes);
      setIsDependencyAlertOpen(true);
      return;
    }

    setProducaoToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (producao: Producao) => {
    setProducaoToEdit(producao);
    setIsFormOpen(true);
  };

  const handleSetStatus = async (
    id: string,
    status: 'ativo' | 'inativo'
  ) => {
    const action = status === 'inativo' ? 'Inativada' : 'Reativada';
    toast.promise(setProducaoStatus(id, status), {
      loading: `${action === 'Inativada' ? 'Inativando' : 'Reativando'} produção...`,
      success: `Produção ${action.toLowerCase()} com sucesso!`,
      error: `Erro ao ${action.toLowerCase()} a produção.`,
    });
  };

  return (
    <>
      <DependencyAlert
        isOpen={isDependencyAlertOpen}
        onOpenChange={setIsDependencyAlertOpen}
        dependencies={missingDependencies}
      />
      <ProducaoForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        producaoToEdit={producaoToEdit}
      />
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ProducaoActions
          onAdd={handleAddNew}
          onSearch={setSearchTerm}
          showInactive={showInactive}
          onShowInactiveChange={setShowInactive}
        />

        <ProducaoStatsCards
          producoes={producoes}
          abates={abates}
          produtos={produtos}
        />

        <ProducaoTable
          data={filteredProducoes}
          funcionarios={funcionarios}
          abates={abates}
          produtos={produtos}
          unidades={unidades}
          onEdit={handleEdit}
          onSetStatus={handleSetStatus}
          expanded={expanded}
          onExpandedChange={setExpanded}
        />
      </motion.div>
    </>
  );
}
