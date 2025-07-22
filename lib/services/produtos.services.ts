import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, serverTimestamp, Query, query, where, QuerySnapshot, DocumentData, Timestamp, addDoc } from "firebase/firestore";
import { Produto, produtoSchema } from "@/lib/schemas";

export const subscribeToProdutos = (
  callback: (produtos: Produto[]) => void,
  includeInactive: boolean = false
) => {
  const q = query(collection(db, "produtos"));

  return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
    const produtos: Produto[] = [];
    querySnapshot.forEach((doc) => {
      const docData = doc.data();
      const dataToParse = { id: doc.id, ...docData };

      const parsed = produtoSchema.safeParse(dataToParse);
      if (parsed.success) {
        produtos.push(parsed.data);
      } else {
        console.error("Documento de produto inválido:", doc.id, parsed.error.format());
      }
    });

    const filteredData = includeInactive ? produtos : produtos.filter(p => p.status === 'ativo');
    callback(filteredData.sort((a, b) => a.nome.localeCompare(b.nome)));
  }, (error) => {
    console.error("Erro no listener de Produtos:", error);
  });
};

export const addProduto = async (produtoData: Omit<Produto, 'id' | 'status' | 'createdAt' | 'quantidade'>) => {
    const dataToSave = {
        ...produtoData,
        quantidade: 0, // Estoque inicial é sempre 0
        status: 'ativo',
        createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, "produtos"), dataToSave);
};

export const updateProduto = async (id: string, produtoData: Partial<Omit<Produto, 'id'>>) => {
    await updateDoc(doc(db, "produtos", id), produtoData);
};

export const setProdutoStatus = async (id: string, status: 'ativo' | 'inativo') => {
    await updateDoc(doc(db, "produtos", id), { status });
};
