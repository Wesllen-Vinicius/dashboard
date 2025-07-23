// lib/services/user.services.ts
import { auth, db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  QuerySnapshot,
  DocumentData,
  query,
  orderBy,
  getDoc
} from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { SystemUser, userSchema } from "@/lib/schemas";
import { createUserInAuth } from "./auth.services";

const usersCollection = collection(db, "users");

// --- FUNÇÕES PARA O MÓDULO DE USUÁRIOS (CRUD) ---

export const subscribeToUsers = (callback: (users: SystemUser[]) => void) => {
  const q = query(usersCollection, orderBy("displayName"));
  return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
    const users: SystemUser[] = [];
    querySnapshot.forEach((doc) => {
      users.push({ ...doc.data(), uid: doc.id } as SystemUser);
    });
    callback(users);
  });
};

export const addUser = async (data: Omit<SystemUser, "uid" | "status" | "dashboardLayout">) => {
  if (!data.password) {
    throw new Error("A senha é obrigatória para criar um novo usuário.");
  }
  const uid = await createUserInAuth(data.email, data.password);
  const user = auth.currentUser;
  if (user && user.uid === uid) {
    await updateProfile(user, { displayName: data.displayName });
  }
  const { password, ...firestoreData } = data;
  const userDocRef = doc(db, "users", uid);
  await setDoc(userDocRef, {
    ...firestoreData,
    status: "ativo",
    uid: uid,
  });
  return uid;
};

export const updateUser = async (uid: string, data: Partial<Pick<SystemUser, 'displayName' | 'role'>>) => {
  const user = auth.currentUser;
  if (user && user.uid === uid && data.displayName) {
    await updateProfile(user, { displayName: data.displayName });
  }
  const userDocRef = doc(db, "users", uid);
  await updateDoc(userDocRef, data);
};

export const setUserStatus = async (uid: string, status: 'ativo' | 'inativo') => {
  const userDocRef = doc(db, "users", uid);
  await updateDoc(userDocRef, { status });
};

// --- FUNÇÕES PARA O DASHBOARD (RE-ADICIONADAS) ---

/**
 * Salva a ordem personalizada dos widgets do dashboard para um usuário específico.
 * @param userId O ID do usuário.
 * @param layout Um array de strings com os IDs dos widgets na nova ordem.
 */
export const saveDashboardLayout = async (userId: string, layout: string[]) => {
  const userDocRef = doc(db, "users", userId);
  await updateDoc(userDocRef, {
    dashboardLayout: layout,
  });
};

/**
 * Busca a ordem dos widgets salva para um usuário.
 * @param userId O ID do usuário.
 * @returns Um array com a ordem dos widgets ou null se não houver.
 */
export const getDashboardLayout = async (userId: string): Promise<string[] | null> => {
  const userDocRef = doc(db, "users", userId);
  const docSnap = await getDoc(userDocRef);
  if (docSnap.exists() && docSnap.data().dashboardLayout) {
    return docSnap.data().dashboardLayout;
  }
  return null;
};
