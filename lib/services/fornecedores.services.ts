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
import { z } from "zod";
import { Fornecedor, FornecedorFormSchema } from "@/lib/schemas";

const fornecedoresCollection = collection(db, "fornecedores");

export const subscribeToFornecedores = (
  callback: (data: Fornecedor[]) => void,
  showAll: boolean = false
) => {
  const q = query(fornecedoresCollection, orderBy("nomeRazaoSocial"));

  return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
    let data: Fornecedor[] = [];
    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() } as Fornecedor);
    });

    if (showAll) {
      callback(
        data.sort((a, b) => {
          if (a.status === 'ativo' && b.status === 'inativo') return -1;
          if (a.status === 'inativo' && b.status === 'ativo') return 1;
          // **CORREÇÃO APLICADA AQUI**
          return a.nomeRazaoSocial.localeCompare(b.nomeRazaoSocial);
        })
      );
    } else {
      const ativos = data.filter((item) => item.status === "ativo");
      callback(ativos);
    }
  });
};

export const addFornecedor = async (
  // **CORREÇÃO:** A tipagem do 'data' foi ajustada para usar FornecedorFormSchema
  data: z.infer<typeof FornecedorFormSchema>,
  user: { uid: string; displayName: string | null }
) => {
  if (!user) throw new Error("Usuário não autenticado.");

  const dataComTimestamp = {
    ...data,
    status: "ativo",
    registradoPor: { uid: user.uid, nome: user.displayName || "Usuário" },
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(fornecedoresCollection, dataComTimestamp);
  return docRef.id;
};

export const updateFornecedor = async (
  id: string,
  // **CORREÇÃO:** A tipagem do 'data' foi ajustada para usar FornecedorFormSchema
  data: Partial<z.infer<typeof FornecedorFormSchema>>
) => {
  const docRef = doc(db, "fornecedores", id);
  await updateDoc(docRef, data);
};

export const setFornecedorStatus = async (
  id: string,
  status: "ativo" | "inativo"
) => {
  const docRef = doc(db, "fornecedores", id);
  await updateDoc(docRef, { status });
};
