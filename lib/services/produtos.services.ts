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

// Função mantida para a página de Produtos
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

// --- NOVA FUNÇÃO ADICIONADA ---
// Função para buscar todos os produtos para o painel de Metas e outros locais
export const subscribeToAllProducts = (
    callback: (produtos: Produto[]) => void
) => {
    const q = query(produtosCollection); // Sem ordenação específica, mais genérico

    return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
        const data: Produto[] = [];
        querySnapshot.forEach((doc) => {
            // Validação para garantir que os dados estão consistentes
            const parsed = produtoSchema.safeParse({ id: doc.id, ...doc.data() });
            if (parsed.success) {
                data.push(parsed.data as Produto);
            } else {
                console.warn("Documento de produto com schema inválido:", doc.id, parsed.error.format());
            }
        });
        callback(data);
    }, (error) => {
        console.error("Erro ao buscar produtos:", error);
    });
};


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

export const updateProduto = async (
  id: string,
  data: Partial<Omit<Produto, "id" | "status" | "createdAt" | "quantidade">>
) => {
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
