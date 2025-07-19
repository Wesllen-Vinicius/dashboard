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
import { Cliente, ClienteFormSchema } from "@/lib/schemas";

const clientesCollection = collection(db, "clientes");

export const subscribeToClientes = (
  callback: (data: Cliente[]) => void,
  showAll: boolean = false
) => {
  const q = query(clientesCollection, orderBy("nomeRazaoSocial"));

  return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
    let data: Cliente[] = [];
    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() } as Cliente);
    });

    if (showAll) {
      callback(
        data.sort((a, b) => {
          if (a.status === 'ativo' && b.status === 'inativo') return -1;
          if (a.status === 'inativo' && b.status === 'ativo') return 1;
          return a.nomeRazaoSocial.localeCompare(b.nomeRazaoSocial);
        })
      );
    } else {
      const ativos = data.filter((item) => item.status === "ativo");
      callback(ativos);
    }
  });
};

export const addCliente = async (
  data: z.infer<typeof ClienteFormSchema>,
  user: { uid: string; displayName: string | null }
) => {
  if (!user) throw new Error("Usuário não autenticado.");

  const dataComTimestamp = {
    ...data,
    status: "ativo",
    registradoPor: { uid: user.uid, nome: user.displayName || "Usuário" },
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(clientesCollection, dataComTimestamp);
  return docRef.id;
};

export const updateCliente = async (
  id: string,
  data: Partial<z.infer<typeof ClienteFormSchema>>
) => {
  const docRef = doc(db, "clientes", id);
  await updateDoc(docRef, data);
};

export const setClienteStatus = async (
  id: string,
  status: "ativo" | "inativo"
) => {
  const docRef = doc(db, "clientes", id);
  await updateDoc(docRef, { status });
};
