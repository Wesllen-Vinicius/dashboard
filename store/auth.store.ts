import { create } from 'zustand';
import { User } from 'firebase/auth';
import { onAuthChanged, logout as signOutService } from '@/lib/services/auth.services';
import { useDataStore } from './data.store';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SystemUser } from '@/lib/schemas';

// O estado agora armazena o tipo de utilizador completo (Firebase User + SystemUser)
interface AuthState {
  user: (User & SystemUser) | null;
  isLoading: boolean;
  initializeAuthListener: () => () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  initializeAuthListener: () => {
    const unsubscribe = onAuthChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Se o utilizador do Firebase existir, busca os dados adicionais no Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const customData = userDocSnap.data() as SystemUser;
          // Junta o utilizador do Firebase com os dados do Firestore
          const completeUser = { ...firebaseUser, ...customData };
          set({ user: completeUser, isLoading: false });
          useDataStore.getState().initializeSubscribers();
        } else {
          // Caso não encontre um documento (situação de erro ou utilizador novo),
          // define o utilizador apenas com os dados do Auth e desloga por segurança.
          console.error("Erro: Documento do utilizador não encontrado no Firestore.");
          await signOutService();
          set({ user: null, isLoading: false });
        }
      } else {
        // Se não houver utilizador no Firebase, limpa tudo
        set({ user: null, isLoading: false });
        useDataStore.getState().clearSubscribers();
      }
    });
    return unsubscribe;
  },
  logout: async () => {
    await signOutService();
    set({ user: null });
  },
}));
