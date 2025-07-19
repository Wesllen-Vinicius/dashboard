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
// **CORREÇÃO:** Importa ambos os tipos necessários do arquivo de schemas.
import { ContaBancaria, ContaBancariaFormSchema } from "@/lib/schemas";

const contasCollection = collection(db, "contasBancarias");

export const subscribeToContasBancarias = (
  callback: (contas: ContaBancaria[]) => void,
  showAll: boolean = false
) => {
  const q = query(collection(db, "contasBancarias"), orderBy("nomeConta"));

  return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
    let contasData: ContaBancaria[] = [];
    querySnapshot.forEach((doc) => {
      contasData.push({ id: doc.id, ...doc.data() } as ContaBancaria);
    });

    if (showAll) {
      callback(
        contasData.sort((a, b) => {
          if (a.status === 'ativa' && b.status === 'inativa') return -1;
          if (a.status === 'inativa' && b.status === 'ativa') return 1;
          return a.nomeConta.localeCompare(b.nomeConta);
        })
      );
    } else {
      const ativas = contasData.filter((c) => c.status === 'ativa');
      callback(ativas);
    }
  });
};

export const addContaBancaria = async (
  // **CORREÇÃO:** O `data` agora é corretamente tipado pelo `ContaBancariaFormSchema`.
  data: z.infer<typeof ContaBancariaFormSchema>,
  user: { uid: string; displayName: string | null }
) => {
  if (!user) throw new Error("Usuário não autenticado.");

  const dataComTimestamp = {
    ...data,
    saldoAtual: data.saldoInicial,
    status: "ativa",
    registradoPor: { uid: user.uid, nome: user.displayName || "Usuário" },
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(contasCollection, dataComTimestamp);
  return docRef.id;
};

export const updateContaBancaria = async (
  id: string,
  data: Partial<z.infer<typeof ContaBancariaFormSchema>>
) => {
  const docRef = doc(db, "contasBancarias", id);
  await updateDoc(docRef, data);
};

export const setContaBancariaStatus = async (
  id: string,
  status: "ativa" | "inativa"
) => {
  const docRef = doc(db, "contasBancarias", id);
  await updateDoc(docRef, { status });
};
