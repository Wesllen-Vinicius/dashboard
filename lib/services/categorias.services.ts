import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { Categoria } from "@/lib/schemas";

export const addCategoria = async (
  categoria: Omit<Categoria, "id" | "createdAt" | "status">
) => {
  const dataWithTimestamp = {
    ...categoria,
    status: "ativo",
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, "categorias"), dataWithTimestamp);
  return docRef.id;
};

export const updateCategoria = async (
  id: string,
  categoria: Partial<Omit<Categoria, "id" | "createdAt" | "status">>
) => {
  const categoriaDoc = doc(db, "categorias", id);
  await updateDoc(categoriaDoc, categoria);
};

export const setCategoriaStatus = async (
  id: string,
  status: "ativo" | "inativo"
) => {
  const categoriaDoc = doc(db, "categorias", id);
  await updateDoc(categoriaDoc, { status });
};

export const subscribeToCategorias = (
  callback: (categorias: Categoria[]) => void,
  showAll: boolean = false
) => {
  const q = query(collection(db, "categorias"), orderBy("nome"));

  return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
    let categoriasData: Categoria[] = [];
    querySnapshot.forEach((doc) => {
      categoriasData.push({ id: doc.id, ...doc.data() } as Categoria);
    });

    if (showAll) {
      // Ordena por status (ativos primeiro), depois por nome
      callback(
        categoriasData.sort((a, b) => {
          if (a.status === "ativo" && b.status === "inativo") return -1;
          if (a.status === "inativo" && b.status === "ativo") return 1;
          return a.nome.localeCompare(b.nome);
        })
      );
    } else {
      // Filtra para mostrar apenas os ativos
      const ativos = categoriasData.filter((cat) => cat.status === "ativo");
      callback(ativos);
    }
  });
};
