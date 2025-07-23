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
import { Categoria, categoriaSchema } from "@/lib/schemas";

const categoriasCollection = collection(db, "categorias");

export const subscribeToCategorias = (
  callback: (categorias: Categoria[]) => void
) => {
  const q = query(categoriasCollection, orderBy("nome"));

  return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
    const data: Categoria[] = [];
    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() } as Categoria);
    });
    callback(data);
  });
};

export const addCategoria = async (
  data: Omit<Categoria, "id" | "status" | "createdAt">
) => {
  const parsedData = categoriaSchema.pick({ nome: true }).parse(data);
  const dataComTimestamp = {
    ...parsedData,
    status: "ativo" as const,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(categoriasCollection, dataComTimestamp);
  return docRef.id;
};

export const updateCategoria = async (
  id: string,
  data: Partial<Omit<Categoria, "id" | "status" | "createdAt">>
) => {
  const parsedData = categoriaSchema.pick({ nome: true }).partial().parse(data);
  const docRef = doc(db, "categorias", id);
  await updateDoc(docRef, parsedData);
};

export const setCategoriaStatus = async (
  id: string,
  status: "ativo" | "inativo"
) => {
  const docRef = doc(db, "categorias", id);
  await updateDoc(docRef, { status });
};
