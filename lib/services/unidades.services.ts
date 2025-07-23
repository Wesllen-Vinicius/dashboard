import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  orderBy,
  QuerySnapshot,
  DocumentData,
  addDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { Unidade, unidadeSchema } from "@/lib/schemas";

const unidadesCollection = collection(db, "unidades");

export const subscribeToUnidades = (
  callback: (unidades: Unidade[]) => void
) => {
  const q = query(unidadesCollection, orderBy("nome"));

  return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
    const data: Unidade[] = [];
    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() } as Unidade);
    });
    callback(data);
  });
};

export const addUnidade = async (
  data: Omit<Unidade, "id" | "status" | "createdAt">
) => {
  const parsedData = unidadeSchema.pick({ nome: true, sigla: true }).parse(data);
  const dataComTimestamp = {
    ...parsedData,
    status: "ativo" as const,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(unidadesCollection, dataComTimestamp);
  return docRef.id;
};

export const updateUnidade = async (
  id: string,
  data: Partial<Omit<Unidade, "id" | "status" | "createdAt">>
) => {
  const parsedData = unidadeSchema.pick({ nome: true, sigla: true }).partial().parse(data);
  const docRef = doc(db, "unidades", id);
  await updateDoc(docRef, parsedData);
};

// Unidades são cadastros simples que podem ser deletados se não houver dependências.
export const deleteUnidade = async (id: string) => {
  const docRef = doc(db, "unidades", id);
  await deleteDoc(docRef);
};
