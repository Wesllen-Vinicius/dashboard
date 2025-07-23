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
import { Cargo, cargoSchema } from "@/lib/schemas";

const cargosCollection = collection(db, "cargos");

export const subscribeToCargos = (
  callback: (cargos: Cargo[]) => void
) => {
  const q = query(cargosCollection, orderBy("nome"));

  return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
    const data: Cargo[] = [];
    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() } as Cargo);
    });
    callback(data);
  });
};

export const addCargo = async (
  data: Omit<Cargo, "id" | "status" | "createdAt">
) => {
  const parsedData = cargoSchema.pick({ nome: true }).parse(data);
  const dataComTimestamp = {
    ...parsedData,
    status: "ativo" as const,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(cargosCollection, dataComTimestamp);
  return docRef.id;
};

export const updateCargo = async (
  id: string,
  data: Partial<Omit<Cargo, "id" | "status" | "createdAt">>
) => {
  const parsedData = cargoSchema.pick({ nome: true }).partial().parse(data);
  const docRef = doc(db, "cargos", id);
  await updateDoc(docRef, parsedData);
};

export const setCargoStatus = async (
  id: string,
  status: "ativo" | "inativo"
) => {
  const docRef = doc(db, "cargos", id);
  await updateDoc(docRef, { status });
};
