import { create } from 'zustand';
import { User } from 'firebase/auth';
import { onAuthChanged, logout as signOutService } from '@/lib/services/auth.services';
import { useDataStore } from './data.store';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  initializeAuthListener: () => () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  initializeAuthListener: () => {
    const unsubscribe = onAuthChanged((user) => {
      set({ user, isLoading: false });
      if (user) {
        // Se o usuário está logado, inicia os listeners de dados.
        useDataStore.getState().initializeSubscribers();
      } else {
        // Se o usuário fez logout ou não está logado, limpa os listeners e os dados.
        useDataStore.getState().clearSubscribers();
      }
    });
    return unsubscribe; // Retorna a função de cleanup do listener de autenticação
  },
  logout: async () => {
    await signOutService();
    set({ user: null });
  },
}));
