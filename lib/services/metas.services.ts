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
} from "firebase/firestore";
import { Meta, metaSchema } from "@/lib/schemas";
import { z } from "zod";

const metasCollection = collection(db, "metas");

export const subscribeToMetas = (
  callback: (metas: Meta[]) => void
) => {
  const q = query(metasCollection, orderBy("createdAt", "desc"));

  return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
    const data: Meta[] = [];
    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() } as Meta);
    });
    callback(data);
  });
};

export const addMeta = async (
  data: Omit<Meta, "id" | "status" | "createdAt">
) => {
  // CORREÇÃO: Validar apenas os campos do schema base
  const parsedData = metaSchema.pick({ produtoId: true, metaPorAnimal: true }).parse(data);
  const dataComTimestamp = {
    ...parsedData,
    // Adicionar os campos desnormalizados manualmente
    produtoNome: data.produtoNome,
    unidade: data.unidade,
    status: "ativo" as const,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(metasCollection, dataComTimestamp);
  return docRef.id;
};

export const updateMeta = async (
  id: string,
  data: Partial<Omit<Meta, "id" | "status" | "createdAt">>
) => {
  // CORREÇÃO: Validar apenas os campos do schema base
  const parsedData = metaSchema.pick({ produtoId: true, metaPorAnimal: true }).partial().parse(data);
  const dataToUpdate: Partial<Meta> = { ...parsedData };

  // Adicionar os campos desnormalizados se eles existirem nos dados de entrada
  if (data.produtoNome) {
    dataToUpdate.produtoNome = data.produtoNome;
  }
  if (data.unidade) {
    dataToUpdate.unidade = data.unidade;
  }

  const docRef = doc(db, "metas", id);
  await updateDoc(docRef, dataToUpdate);
};

export const setMetaStatus = async (
  id: string,
  status: "ativo" | "inativo"
) => {
  const docRef = doc(db, "metas", id);
  await updateDoc(docRef, { status });
};
