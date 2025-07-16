import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, doc, updateDoc, QuerySnapshot, DocumentData, serverTimestamp, query, where } from "firebase/firestore";
import { Unidade } from "@/lib/schemas";

export const addUnidade = async (unidade: Omit<Unidade, 'id' | 'createdAt' | 'status'>) => {
  const dataWithTimestamp = { ...unidade, status: 'ativo', createdAt: serverTimestamp() };
  await addDoc(collection(db, "unidades"), dataWithTimestamp);
};

export const updateUnidade = async (id: string, unidade: Partial<Omit<Unidade, 'id' | 'createdAt' | 'status'>>) => {
  const unidadeDoc = doc(db, "unidades", id);
  await updateDoc(unidadeDoc, unidade);
};

export const setUnidadeStatus = async (id: string, status: 'ativo' | 'inativo') => {
    const unidadeDoc = doc(db, "unidades", id);
    await updateDoc(unidadeDoc, { status });
};

export const subscribeToUnidades = (
  callback: (unidades: Unidade[]) => void,
  showAll: boolean = false
) => {
  const q = showAll
    ? query(collection(db, "unidades"))
    : query(collection(db, "unidades"), where("status", "==", "ativo"));

  return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
    const unidades: Unidade[] = [];
    querySnapshot.forEach((doc) => {
      unidades.push({ id: doc.id, ...doc.data() as Omit<Unidade, 'id'> });
    });
    callback(unidades.sort((a, b) => {
        if (a.status === b.status) return 0;
        return a.status === 'ativo' ? -1 : 1;
    }));
  });
};
