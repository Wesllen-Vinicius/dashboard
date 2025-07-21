import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, serverTimestamp, Query, query, where, QuerySnapshot, DocumentData, Timestamp, addDoc } from "firebase/firestore";
import { Producao, producaoSchema } from "@/lib/schemas";
import { z } from "zod";

const formSchema = producaoSchema.pick({
  data: true,
  responsavelId: true,
  abateId: true,
  lote: true,
  descricao: true,
  produtos: true,
});
type ProducaoFormValues = z.infer<typeof formSchema>;

export const subscribeToProducoes = (
  callback: (producoes: Producao[]) => void,
  includeInactive: boolean = false
) => {
  const q = query(collection(db, "producao"));

  return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
    const producoes: Producao[] = [];
    querySnapshot.forEach((doc) => {
      const docData = doc.data();
      const dataToParse = {
        id: doc.id,
        ...docData,
        data: docData.data instanceof Timestamp ? docData.data.toDate() : docData.data,
        createdAt: docData.createdAt instanceof Timestamp ? docData.createdAt.toDate() : docData.createdAt,
      };

      const parsed = producaoSchema.safeParse(dataToParse);
      if (parsed.success) {
        producoes.push(parsed.data);
      } else {
        console.error("Documento de produção inválido:", doc.id, parsed.error.format());
      }
    });

    const filteredData = includeInactive ? producoes : producoes.filter(p => p.status === 'ativo');
    callback(filteredData.sort((a, b) => b.data.getTime() - a.data.getTime()));
  }, (error) => {
    console.error("Erro no listener de Produções:", error);
  });
};


export const addProducao = async (producaoData: Omit<Producao, 'id' | 'status' | 'createdAt'>) => {
    const dataToSave = {
        ...producaoData,
        status: 'ativo',
        createdAt: serverTimestamp(),
        data: Timestamp.fromDate(producaoData.data),
    };
    await addDoc(collection(db, "producao"), dataToSave);
};


export const updateProducao = async (id: string, producaoData: Partial<Omit<Producao, 'id'>>) => {
    const dataToUpdate: { [key: string]: any } = { ...producaoData };
    if (producaoData.data) {
        dataToUpdate.data = Timestamp.fromDate(producaoData.data);
    }
    await updateDoc(doc(db, "producao", id), dataToUpdate);
};

export const setProducaoStatus = async (id: string, status: 'ativo' | 'inativo') => {
    await updateDoc(doc(db, "producao", id), { status });
};
