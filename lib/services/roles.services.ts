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
  deleteDoc,
} from "firebase/firestore";
import { Role, roleSchema } from "@/lib/schemas";
import { z } from "zod";

const rolesCollection = collection(db, "roles");

export const subscribeToRoles = (
  callback: (roles: Role[]) => void
) => {
  const q = query(rolesCollection, orderBy("nome"));

  return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
    const data: Role[] = [];
    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() } as Role);
    });
    callback(data);
  });
};

export const addRole = async (
  data: Omit<Role, "id">
) => {
  const parsedData = roleSchema.omit({ id: true }).parse(data);
  const dataComTimestamp = {
    ...parsedData,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(rolesCollection, dataComTimestamp);
  return docRef.id;
};

export const updateRole = async (
  id: string,
  data: Partial<Omit<Role, "id">>
) => {
  const parsedData = roleSchema.omit({ id: true }).partial().parse(data);
  const docRef = doc(db, "roles", id);
  await updateDoc(docRef, parsedData);
};

export const deleteRole = async (id: string) => {
  const docRef = doc(db, "roles", id);
  await deleteDoc(docRef);
};
