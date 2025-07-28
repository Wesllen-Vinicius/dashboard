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

// Assina todas as unidades, ordenadas por nome (usado em produtos/NF-e)
export const subscribeToUnidades = (
  callback: (unidades: Unidade[]) => void
) => {
  const q = query(unidadesCollection, orderBy("nome"));

  return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
    const data: Unidade[] = [];
    querySnapshot.forEach((docSnap) => {
      data.push({ id: docSnap.id, ...docSnap.data() } as Unidade);
    });
    callback(data);
  });
};

// Adiciona nova unidade (usado no cadastro de produtos de venda para NF-e)
export const addUnidade = async (
  data: Omit<Unidade, "id" | "status" | "createdAt">
) => {
  // Só exige nome e sigla, pois status e createdAt são preenchidos aqui
  const parsedData = unidadeSchema.pick({ nome: true, sigla: true }).parse(data);
  const dataComTimestamp = {
    ...parsedData,
    status: "ativo" as const,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(unidadesCollection, dataComTimestamp);
  return docRef.id;
};

// Atualiza uma unidade existente
export const updateUnidade = async (
  id: string,
  data: Partial<Omit<Unidade, "id" | "status" | "createdAt">>
) => {
  const parsedData = unidadeSchema.pick({ nome: true, sigla: true }).partial().parse(data);
  const docRef = doc(db, "unidades", id);
  await updateDoc(docRef, parsedData);
};

// Exclui uma unidade (certifique-se de não excluir unidades usadas em produtos!)
export const deleteUnidade = async (id: string) => {
  const docRef = doc(db, "unidades", id);
  await deleteDoc(docRef);
};
