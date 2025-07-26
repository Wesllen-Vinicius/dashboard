import { create } from 'zustand';
import { Unsubscribe } from 'firebase/firestore';
import {
  Cliente, Fornecedor, Produto, Funcionario, Cargo, Unidade, Categoria, Compra, Abate, Producao, Venda, SystemUser, ContaBancaria, Movimentacao
} from '@/lib/schemas';

import { subscribeToClientes } from '@/lib/services/clientes.services';
import { subscribeToFornecedores } from '@/lib/services/fornecedores.services';
import { subscribeToProdutos } from '@/lib/services/produtos.services';
import { subscribeToFuncionarios } from '@/lib/services/funcionarios.services';
import { subscribeToCargos } from '@/lib/services/cargos.services';
import { subscribeToUnidades } from '@/lib/services/unidades.services';
import { subscribeToCategorias } from '@/lib/services/categorias.services';
import { subscribeToAbatesByDateRange } from '@/lib/services/abates.services';
import { subscribeToProducoes } from '@/lib/services/producao.services';
import { subscribeToVendas } from '@/lib/services/vendas.services';
import { subscribeToComprasByDateRange } from '@/lib/services/compras.services';
import { subscribeToUsers } from '@/lib/services/user.services';
import { subscribeToContasBancarias } from '@/lib/services/contasBancarias.services';
import { subscribeToMovimentacoes } from '@/lib/services/estoque.services'; // <-- Importação adicionada

interface DataState {
  isDataLoaded: boolean;
  initializeSubscribers: () => void;
  clearSubscribers: () => void;
  clientes: Cliente[];
  fornecedores: Fornecedor[];
  produtos: Produto[];
  funcionarios: Funcionario[];
  cargos: Cargo[];
  unidades: Unidade[];
  categorias: Categoria[];
  compras: Compra[];
  abates: Abate[];
  producoes: Producao[];
  vendas: Venda[];
  users: SystemUser[];
  contasBancarias: ContaBancaria[];
  movimentacoes: Movimentacao[]; // <-- Propriedade adicionada
}

let unsubscribers: Unsubscribe[] = [];

const initialState = {
    isDataLoaded: false,
    clientes: [],
    fornecedores: [],
    produtos: [],
    funcionarios: [],
    cargos: [],
    unidades: [],
    categorias: [],
    compras: [],
    abates: [],
    producoes: [],
    vendas: [],
    users: [],
    contasBancarias: [],
    movimentacoes: [], // <-- Propriedade adicionada
}

export const useDataStore = create<DataState>((set, get) => ({
    ...initialState,
    initializeSubscribers: () => {
      if (get().isDataLoaded) return;

      const subscriptions = [
        subscribeToClientes((data) => set({ clientes: data })),
        subscribeToFornecedores((data) => set({ fornecedores: data })),
        subscribeToProdutos((data) => set({ produtos: data })),
        subscribeToFuncionarios((data) => set({ funcionarios: data })),
        subscribeToCargos((data) => set({ cargos: data })),
        subscribeToUnidades((data) => set({ unidades: data })),
        subscribeToCategorias((data) => set({ categorias: data })),
        subscribeToAbatesByDateRange(undefined, (data) => set({ abates: data })),
        subscribeToProducoes((data) => set({ producoes: data })),
        subscribeToVendas((data) => set({ vendas: data })),
        subscribeToComprasByDateRange(undefined, (data) => set({ compras: data })),
        subscribeToUsers((data) => set({ users: data })),
        subscribeToContasBancarias((data) => set({ contasBancarias: data })),
        subscribeToMovimentacoes((data) => set({ movimentacoes: data })), // <-- Inscrição adicionada
      ];

      unsubscribers = subscriptions;
      set({ isDataLoaded: true });
    },
    clearSubscribers: () => {
      unsubscribers.forEach(unsub => unsub());
      unsubscribers = [];
      set({ ...initialState });
    },
}));
