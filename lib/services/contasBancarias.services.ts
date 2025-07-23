import { auth, db } from "@/lib/firebase"; // Import auth
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
import { ContaBancaria, ContaBancariaFormSchema } from "@/lib/schemas";
import { z } from "zod";

const contasBancariasCollection = collection(db, "contas-bancarias");

export const subscribeToContasBancarias = (
  callback: (contas: ContaBancaria[]) => void
) => {
  const q = query(contasBancariasCollection, orderBy("nomeConta"));

  return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
    const data: ContaBancaria[] = [];
    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() } as ContaBancaria);
    });
    callback(data);
  });
};

export const addContaBancaria = async (
  data: z.infer<typeof ContaBancariaFormSchema>
) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const parsedData = ContaBancariaFormSchema.parse(data);
  const dataComTimestamp = {
    ...parsedData,
    saldoAtual: parsedData.saldoInicial,
    status: "ativa" as const,
    registradoPor: {
      uid: user.uid,
      nome: user.displayName || "Usuário desconhecido",
    },
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(contasBancariasCollection, dataComTimestamp);
  return docRef.id;
};

export const updateContaBancaria = async (
  id: string,
  data: Partial<z.infer<typeof ContaBancariaFormSchema>>
) => {
  const parsedData = ContaBancariaFormSchema.partial().parse(data);
  const docRef = doc(db, "contas-bancarias", id);
  await updateDoc(docRef, parsedData);
};

export const setContaBancariaStatus = async (
  id: string,
  status: "ativa" | "inativa"
) => {
  const docRef = doc(db, "contas-bancarias", id);
  await updateDoc(docRef, { status });
};
