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

// Assina os produtos ordenados por nome (uso na tela de vendas/NF)
export const subscribeToProdutos = (
  callback: (produtos: Produto[]) => void
) => {
  const q = query(produtosCollection, orderBy("nome"));

  return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
    const data: Produto[] = [];
    querySnapshot.forEach((docSnap) => {
      // Trata campos para consistência (pode adicionar aqui .toDate se houver campos Date no produto futuramente)
      data.push({ id: docSnap.id, ...docSnap.data() } as Produto);
    });
    callback(data);
  });
};

// Assinatura alternativa: busca todos os produtos sem ordenação
export const subscribeToAllProducts = (
  callback: (produtos: Produto[]) => void
) => {
  const q = query(produtosCollection);

  return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
    const data: Produto[] = [];
    querySnapshot.forEach((docSnap) => {
      // Valida o schema para evitar produtos inválidos (especialmente para NF-e)
      const parsed = produtoSchema.safeParse({ id: docSnap.id, ...docSnap.data() });
      if (parsed.success) {
        data.push(parsed.data as Produto);
      } else {
        console.warn("Produto inválido para schema:", docSnap.id, parsed.error.format());
      }
    });
    callback(data);
  }, (error) => {
    console.error("Erro ao buscar produtos:", error);
  });
};

// Adiciona novo produto (completo, pronto para cadastro de produtos de venda ou matéria-prima)
export const addProduto = async (
  data: Omit<Produto, "id" | "status" | "createdAt" | "quantidade">
) => {
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

// Atualiza qualquer campo do produto (inclusive fiscais: NCM, CFOP, unidade, etc)
export const updateProduto = async (
  id: string,
  data: Partial<Omit<Produto, "id" | "status" | "createdAt" | "quantidade">>
) => {
  const docRef = doc(db, "produtos", id);
  await updateDoc(docRef, data);
};

// Ativa/inativa produto
export const setProdutoStatus = async (
  id: string,
  status: "ativo" | "inativo"
) => {
  const docRef = doc(db, "produtos", id);
  await updateDoc(docRef, { status });
};
