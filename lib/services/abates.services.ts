import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, serverTimestamp, Query, query, where, QuerySnapshot, DocumentData, Timestamp, addDoc } from "firebase/firestore";
import { Abate, abateSchema } from "@/lib/schemas";
import { z } from "zod";
import { DateRange } from "react-day-picker";

const formSchema = abateSchema.pick({
  data: true,
  total: true,
  condenado: true,
  responsavelId: true,
  compraId: true,
});
type AbateFormValues = z.infer<typeof formSchema>;

// Função para a página de Abates (CRUD)
export const subscribeToAbates = (
  callback: (abates: Abate[]) => void,
  includeInactive: boolean = false
) => {
  const q = query(collection(db, "abates"));

  return onSnapshot(q, (querySnapshot) => {
    const abates: Abate[] = [];
    querySnapshot.forEach((doc) => {
      const docData = doc.data();
      const dataToParse = {
        id: doc.id,
        ...docData,
        data: docData.data instanceof Timestamp ? docData.data.toDate() : docData.data,
        createdAt: docData.createdAt instanceof Timestamp ? docData.createdAt.toDate() : docData.createdAt,
      };

      const parsed = abateSchema.safeParse(dataToParse);
      if (parsed.success) {
        abates.push(parsed.data);
      } else {
        console.error("Documento de abate inválido (subscribeToAbates):", doc.id, parsed.error.format());
      }
    });

    const filteredData = includeInactive ? abates : abates.filter(abate => abate.status === 'ativo');
    callback(filteredData.sort((a, b) => b.data.getTime() - a.data.getTime()));
  }, (error) => {
    console.error("Erro no listener de Abates (CRUD):", error);
  });
};

// Função para a data.store.ts (Dashboard)
export const subscribeToAbatesByDateRange = (
  dateRange: DateRange | undefined,
  callback: (abates: Abate[]) => void
) => {
  // Apenas busca os ativos, conforme lógica original
  const q = query(collection(db, "abates"), where("status", "==", "ativo"));

  return onSnapshot(q, (querySnapshot) => {
    let abates: Abate[] = [];
    querySnapshot.forEach((doc) => {
      const docData = doc.data();
      const dataToParse = {
        id: doc.id,
        ...docData,
        data: docData.data instanceof Timestamp ? docData.data.toDate() : docData.data,
        createdAt: docData.createdAt instanceof Timestamp ? docData.createdAt.toDate() : docData.createdAt,
      };

      const parsed = abateSchema.safeParse(dataToParse);
      if (parsed.success) {
        abates.push(parsed.data);
      } else {
        console.error("Documento de abate inválido (DateRange):", doc.id, parsed.error.format());
      }
    });

    let filteredData = abates;

    if (dateRange?.from) {
      const toDate = dateRange.to || dateRange.from;
      const fromTimestamp = new Date(dateRange.from.setHours(0, 0, 0, 0)).getTime();
      const toTimestamp = new Date(toDate.setHours(23, 59, 59, 999)).getTime();
      filteredData = filteredData.filter(abate => {
        const abateTime = abate.data.getTime();
        return abateTime >= fromTimestamp && abateTime <= toTimestamp;
      });
    }

    callback(filteredData.sort((a, b) => b.data.getTime() - a.data.getTime()));
  }, (error) => {
    console.error("Erro no listener de Abates (DateRange):", error);
  });
};

export const addAbate = async (formValues: AbateFormValues, user: { uid: string; nome: string; role?: 'ADMINISTRADOR' | 'USUARIO' }) => {
  try {
    const dataToSave = {
      ...formValues,
      registradoPor: user,
      status: 'ativo',
      createdAt: serverTimestamp(),
      data: Timestamp.fromDate(formValues.data),
    };
    await addDoc(collection(db, "abates"), dataToSave);
  } catch (e) {
    console.error("Erro ao adicionar abate: ", e);
    throw new Error("Não foi possível adicionar o registro de abate.");
  }
};

export const updateAbate = async (id: string, formValues: Partial<AbateFormValues>) => {
  const dataToUpdate: { [key: string]: any } = { ...formValues };
  if (formValues.data) {
    dataToUpdate.data = Timestamp.fromDate(formValues.data);
  }
  const abateDoc = doc(db, "abates", id);
  await updateDoc(abateDoc, dataToUpdate);
};

export const setAbateStatus = async (id: string, status: 'ativo' | 'inativo') => {
  const abateDoc = doc(db, "abates", id);
  await updateDoc(abateDoc, { status });
};
