'use client';

import { createContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { SystemUser, UserInfo } from '@/types/user.types';

export interface AuthContextType {
  user: (User & UserInfo) | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<(User & UserInfo) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const customData = userDocSnap.data() as SystemUser;
          // Correção: Mapeia displayName para a propriedade 'nome' exigida.
          const finalUser: User & UserInfo = {
            ...firebaseUser,
            ...customData,
            nome: customData.displayName,
          };
          setUser(finalUser);
        } else {
          // Correção: Garante que 'nome' exista mesmo sem dados do Firestore.
          const finalUser: User & UserInfo = {
            ...firebaseUser,
            uid: firebaseUser.uid,
            nome: firebaseUser.displayName || 'Usuário',
            role: 'USUARIO', // Define um role padrão se não houver doc
          };
          setUser(finalUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = { user, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
