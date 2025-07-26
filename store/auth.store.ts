import { create } from 'zustand';
import { User } from 'firebase/auth';
import { onAuthChanged, logout as signOutService } from '@/lib/services/auth.services';
import { useDataStore } from './data.store';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SystemUser } from '@/lib/schemas';

type UserRole = 'ADMINISTRADOR' | 'USUARIO';

interface AuthState {
  user: (User & SystemUser) | null;
  role: UserRole | null; // <-- Propriedade adicionada
  isLoading: boolean;
  initializeAuthListener: () => () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null, // <-- Propriedade adicionada
  isLoading: true,
  initializeAuthListener: () => {
    const unsubscribe = onAuthChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const customData = userDocSnap.data() as SystemUser;
          const completeUser = { ...firebaseUser, ...customData };
          // Define o usuário completo e a role
          set({ user: completeUser, role: customData.role, isLoading: false });
          useDataStore.getState().initializeSubscribers();
        } else {
          console.error("Erro: Documento do utilizador não encontrado no Firestore.");
          await signOutService();
          set({ user: null, role: null, isLoading: false });
        }
      } else {
        set({ user: null, role: null, isLoading: false });
        useDataStore.getState().clearSubscribers();
      }
    });
    return unsubscribe;
  },
  logout: async () => {
    await signOutService();
    set({ user: null, role: null });
  },
}));
