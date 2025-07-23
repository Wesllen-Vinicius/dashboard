// lib/services/user.services.ts
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, QuerySnapshot, DocumentData, query, where, getDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { SystemUser } from "@/lib/schemas";
import { createUserInAuth } from "./auth.services"; // Importando do auth service

// --- FUNÇÕES EXISTENTES ---

export const setUserDoc = async (userData: Omit<SystemUser, 'password'>) => {
  const userDocRef = doc(db, "users", userData.uid);
  await setDoc(userDocRef, userData, { merge: true });
};

export const subscribeToUsers = (callback: (users: SystemUser[]) => void) => {
  return onSnapshot(collection(db, "users"), (querySnapshot: QuerySnapshot<DocumentData>) => {
    const users: SystemUser[] = [];
    querySnapshot.forEach((doc) => {
      users.push({
        ...doc.data(),
        uid: doc.id,
      } as SystemUser);
    });
    callback(users);
  });
};

export const setUserStatus = async (uid: string, status: 'ativo' | 'inativo') => {
    const userDocRef = doc(db, "users", uid);
    await updateDoc(userDocRef, { status });
};

// --- FUNÇÕES NOVAS E CONSOLIDADAS PARA O CRUD ---

/**
 * Adiciona um novo usuário (Auth + Firestore).
 */
export const addUser = async (data: Omit<SystemUser, "uid" | "status" | "dashboardLayout">) => {
    if (!data.password) {
      throw new Error("A senha é obrigatória para criar um novo usuário.");
    }
    // 1. Cria o usuário no Firebase Auth
    const uid = await createUserInAuth(data.email, data.password);

    // 2. Atualiza o perfil no Auth com o displayName
    const user = auth.currentUser;
    if (user && user.uid === uid) {
      await updateProfile(user, { displayName: data.displayName });
    }

    // 3. Salva os dados no Firestore
    const { password, ...firestoreData } = data;
    await setUserDoc({
      ...firestoreData,
      status: "ativo",
      uid: uid,
    });

    return uid;
};

/**
 * Atualiza os dados de um usuário (Auth + Firestore).
 */
export const updateUser = async (uid: string, data: Partial<Pick<SystemUser, 'displayName' | 'role'>>) => {
    const user = auth.currentUser;
    // Atualiza o displayName no Auth, se o usuário logado for o que está sendo editado
    if (user && user.uid === uid && data.displayName) {
        await updateProfile(user, { displayName: data.displayName });
    }

    // Atualiza os dados no documento do Firestore
    const userDocRef = doc(db, "users", uid);
    await updateDoc(userDocRef, data);
};
