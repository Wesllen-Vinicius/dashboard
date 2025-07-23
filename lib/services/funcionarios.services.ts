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
import { Funcionario, funcionarioSchema } from "@/lib/schemas";

const funcionariosCollection = collection(db, "funcionarios");

export const subscribeToFuncionarios = (
  callback: (funcionarios: Funcionario[]) => void,
  showAll: boolean = false
) => {
  const q = query(funcionariosCollection, orderBy("nomeCompleto"));

  return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
    let data: Funcionario[] = [];
    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() } as Funcionario);
    });

    if (showAll) {
      callback(
        data.sort((a, b) => {
          if (a.status === "ativo" && b.status === "inativo") return -1;
          if (a.status === "inativo" && b.status === "ativo") return 1;
          return a.nomeCompleto.localeCompare(b.nomeCompleto);
        })
      );
    } else {
      const ativos = data.filter((item) => item.status === "ativo");
      callback(ativos);
    }
  });
};

export const addFuncionario = async (
  data: Omit<Funcionario, "id" | "createdAt" | "status">
) => {
  const parsedData = funcionarioSchema.omit({ id: true, createdAt: true, status: true }).parse(data);
  const dataComTimestamp = {
    ...parsedData,
    status: "ativo" as const,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(funcionariosCollection, dataComTimestamp);
  return docRef.id;
};

export const updateFuncionario = async (
  id: string,
  data: Partial<Omit<Funcionario, "id" | "createdAt" | "status">>
) => {
  const parsedData = funcionarioSchema.omit({ id: true, createdAt: true, status: true }).partial().parse(data);
  const docRef = doc(db, "funcionarios", id);
  await updateDoc(docRef, parsedData);
};

export const setFuncionarioStatus = async (
  id: string,
  status: "ativo" | "inativo"
) => {
  const docRef = doc(db, "funcionarios", id);
  await updateDoc(docRef, { status });
};
