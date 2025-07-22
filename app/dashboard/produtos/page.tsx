'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useData } from '@/hooks/use-data';
import { Produto, Unidade, Categoria } from '@/lib/schemas';
import { subscribeToProdutos, setProdutoStatus } from '@/lib/services/produtos.services';
import { ExpandedState } from '@tanstack/react-table';
import { ProdutosActions } from './components/produtos-actions';
import { ProdutosTable } from './components/produtos-table';
import { ProdutoForm } from './components/produtos-form';
import { DependencyAlert } from '@/components/dependency-alert';

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [filteredProdutos, setFilteredProdutos] = useState<Produto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [showInactive, setShowInactive] = useState(false);

  const [isDependencyAlertOpen, setIsDependencyAlertOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [produtoToEdit, setProdutoToEdit] = useState<Produto | null>(null);

  const { data: unidades, loading: loadingUnidades } = useData<Unidade>('unidades', false);
  const { data: categorias, loading: loadingCategorias } = useData<Categoria>('categorias', false);

  useEffect(() => {
    const unsubscribe = subscribeToProdutos(setProdutos, showInactive);
    return () => unsubscribe();
  }, [showInactive]);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered = produtos.filter(item =>
      item.nome.toLowerCase().includes(lowercasedFilter) ||
      item.codigo?.toLowerCase().includes(lowercasedFilter) ||
      searchTerm === ''
    );
    setFilteredProdutos(filtered);
  }, [searchTerm, produtos]);

  const handleAddNew = () => {
    const missingDependencies = [];
    if (unidades.filter(u => u.status === 'ativo').length === 0) {
      missingDependencies.push({ name: 'Unidades de Medida', link: '/dashboard/unidades' });
    }
    if (categorias.filter(c => c.status === 'ativo').length === 0) {
      missingDependencies.push({ name: 'Categorias', link: '/dashboard/categorias' });
    }

    if (missingDependencies.length > 0) {
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

  const handleSetStatus = async (id: string, status: 'ativo' | 'inativo') => {
    const action = status === 'inativo' ? 'Inativado' : 'Reativado';
    toast.promise(setProdutoStatus(id, status), {
      loading: `${action === 'Inativado' ? 'Inativando' : 'Reativando'} produto...`,
      success: `Produto ${action.toLowerCase()} com sucesso!`,
      error: `Erro ao ${action.toLowerCase()} o produto.`,
    });
  };

  const isLoading = loadingUnidades || loadingCategorias;

  return (
    <>
      <DependencyAlert
        isOpen={isDependencyAlertOpen}
        onOpenChange={setIsDependencyAlertOpen}
        dependencies={[
          { name: 'Unidades de Medida', link: '/dashboard/unidades' },
          { name: 'Categorias', link: '/dashboard/categorias' },
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
        <ProdutosActions
          onAdd={handleAddNew}
          onSearch={setSearchTerm}
          showInactive={showInactive}
          onShowInactiveChange={setShowInactive}
        />
        {isLoading ? (
          <p>Carregando dados...</p>
        ) : (
          <ProdutosTable
            data={filteredProdutos}
            unidades={unidades}
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
