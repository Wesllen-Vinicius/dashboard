'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useData } from '@/hooks/use-data';
import { Compra, Fornecedor, Produto } from '@/lib/schemas';
import { subscribeToCompras, setCompraStatus } from '@/lib/services/compras.services';
import { ExpandedState } from '@tanstack/react-table';
import { CompraActions } from './components/compra-actions';
import { CompraTable } from './components/compra-table';
import { CompraForm } from './components/compra-form';
import { DependencyAlert } from '@/components/dependency-alert';
import { CompraStatsCards } from './components/compra-stats-cards';

export default function ComprasPage() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [filteredCompras, setFilteredCompras] = useState<Compra[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [showInactive, setShowInactive] = useState(false);

  // Controle dos modais com estado local
  const [isDependencyAlertOpen, setIsDependencyAlertOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [compraToEdit, setCompraToEdit] = useState<Compra | null>(null);

  const { data: fornecedores, loading: loadingFornecedores } = useData<Fornecedor>('fornecedores', false);
  const { data: produtos, loading: loadingProdutos } = useData<Produto>('produtos', false);

  useEffect(() => {
    const unsubscribe = subscribeToCompras(setCompras, showInactive);
    return () => unsubscribe();
  }, [showInactive]);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered = compras.filter(item =>
      item.notaFiscal.toLowerCase().includes(lowercasedFilter) || searchTerm === ''
    );
    setFilteredCompras(filtered);
  }, [searchTerm, compras]);

  const handleAddNew = () => {
    const activeFornecedores = fornecedores.filter(f => f.status === 'ativo');
    const activeProdutos = produtos.filter(p => p.status === 'ativo');

    if (activeFornecedores.length === 0 || activeProdutos.length === 0) {
      setIsDependencyAlertOpen(true);
      return;
    }
    setCompraToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (compra: Compra) => {
    setCompraToEdit(compra);
    setIsFormOpen(true);
  };

  const handleSetStatus = async (id: string, status: 'ativo' | 'inativo') => {
    const action = status === 'inativo' ? 'Inativada' : 'Reativada';
    toast.promise(setCompraStatus(id, status), {
      loading: `${action === 'Inativada' ? 'Inativando' : 'Reativando'} compra...`,
      success: `Compra ${action.toLowerCase()} com sucesso!`,
      error: `Erro ao ${action.toLowerCase()} a compra.`,
    });
  };

  const isLoading = loadingFornecedores || loadingProdutos;

  return (
    <>
      <DependencyAlert
        isOpen={isDependencyAlertOpen}
        onOpenChange={setIsDependencyAlertOpen}
        dependencies={[
          { name: 'Fornecedores Ativos', link: '/dashboard/fornecedores' },
          { name: 'Produtos Ativos', link: '/dashboard/produtos' },
        ]}
      />
      <CompraForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        compraToEdit={compraToEdit}
      />
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <CompraActions
          onAdd={handleAddNew}
          onSearch={setSearchTerm}
          showInactive={showInactive}
          onShowInactiveChange={setShowInactive}
        />
        <CompraStatsCards compras={compras} />
        {isLoading ? (
          <p>Carregando dados...</p>
        ) : (
          <CompraTable
            data={filteredCompras}
            fornecedores={fornecedores}
            onEdit={handleEdit}
            onSetStatus={handleSetStatus}
            expanded={expanded}
            onExpandedChange={setExpanded}
          />
        )}
      </motion.div>
    </>
  );
}
