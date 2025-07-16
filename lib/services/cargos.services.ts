import { db } from "../firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { Cargo } from "../schemas";

export const addCargo = async (cargo: Omit<Cargo, 'id' | 'createdAt' | 'status'>) => {
  const dataWithTimestamp = { ...cargo, status: 'ativo', createdAt: serverTimestamp() };
  await addDoc(collection(db, "cargos"), dataWithTimestamp);
};

export const updateCargo = async (id: string, cargo: Partial<Omit<Cargo, 'id' | 'createdAt' | 'status'>>) => {
  const cargoDoc = doc(db, "cargos", id);
  await updateDoc(cargoDoc, cargo);
};

export const setCargoStatus = async (id: string, status: 'ativo' | 'inativo') => {
  const cargoRef = doc(db, "cargos", id);
  await updateDoc(cargoRef, { status });
};

export const subscribeToCargos = (
  callback: (cargos: Cargo[]) => void,
  showAll: boolean = false
) => {
  const q = showAll
    ? query(collection(db, "cargos"))
    : query(collection(db, "cargos"), where("status", "==", "ativo"));

  return onSnapshot(q, (querySnapshot) => {
    const cargosData: Cargo[] = [];
    querySnapshot.forEach((doc) => {
      cargosData.push({ id: doc.id, ...doc.data() } as Cargo);
    });
    callback(cargosData.sort((a, b) => {
      if (a.status === b.status) return 0;
      return a.status === 'ativo' ? -1 : 1;
    }));
  });
};
