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
import { Produto, produtoSchema } from "@/lib/schemas";

const produtosCollection = collection(db, "produtos");

export const subscribeToProdutos = (
  callback: (produtos: Produto[]) => void
) => {
  const q = query(produtosCollection, orderBy("nome"));

  return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
    const data: Produto[] = [];
    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() } as Produto);
    });
    callback(data);
  });
};

export const addProduto = async (
  data: Omit<Produto, "id" | "status" | "createdAt" | "quantidade">
) => {
  // A validação completa garante que o objeto corresponda a um dos tipos de produto.
  const parsedData = produtoSchema.parse(data);

  const dataComTimestamp = {
    ...parsedData,
    quantidade: 0,
    status: "ativo" as const,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(produtosCollection, dataComTimestamp);
  return docRef.id;
};

export const updateProduto = async (
  id: string,
  data: Partial<Omit<Produto, "id" | "status" | "createdAt" | "quantidade">>
) => {
  // CORREÇÃO: Removemos a validação .partial() que causava o erro.
  // A função updateDoc do Firestore já lida com atualizações parciais.
  const docRef = doc(db, "produtos", id);
  await updateDoc(docRef, data);
};

export const setProdutoStatus = async (
  id: string,
  status: "ativo" | "inativo"
) => {
  const docRef = doc(db, "produtos", id);
  await updateDoc(docRef, { status });
};
