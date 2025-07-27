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
import { updateProfile, updatePassword } from "firebase/auth";
import { SystemUser } from "@/lib/schemas";
import { createUserInAuth } from "./auth.services";

const usersCollection = collection(db, "users");

// --- INTERFACE PARA AS CONFIGURAÇÕES DO DASHBOARD ---
export interface DashboardConfig {
    order: string[];
    visible: { [key: string]: boolean };
}


// --- FUNÇÕES EXISTENTES ---

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
    const userDocRef = doc(db, "users", uid);
    await updateDoc(userDocRef, data);
};

export const setUserStatus = async (uid: string, status: 'ativo' | 'inativo') => {
    const userDocRef = doc(db, "users", uid);
    await updateDoc(userDocRef, { status });
};

// --- FUNÇÕES DO DASHBOARD ATUALIZADAS ---

export const saveDashboardConfig = async (userId: string, config: DashboardConfig) => {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
        dashboardConfig: config,
    });
};

export const getDashboardConfig = async (userId: string): Promise<DashboardConfig | null> => {
    const userDocRef = doc(db, "users", userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists() && docSnap.data().dashboardConfig) {
        return docSnap.data().dashboardConfig as DashboardConfig;
    }
    return null;
};


// --- NOVA FUNÇÃO PARA A PÁGINA "MINHA CONTA" ---

export async function updateUserProfile(data: { displayName: string; password?: string }) {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("Usuário não autenticado.");
    }
    const userDocRef = doc(db, "users", user.uid);

    await updateDoc(userDocRef, { displayName: data.displayName });
    await updateProfile(user, { displayName: data.displayName });

    if (data.password && data.password.length >= 6) {
        await updatePassword(user, data.password);
    }
}
