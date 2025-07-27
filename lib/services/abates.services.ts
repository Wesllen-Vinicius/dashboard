// src/lib/services/abates.services.ts
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { Abate, abateSchema } from "@/lib/schemas";
import { z } from "zod";
import { DateRange } from "react-day-picker";

// Apenas o subconjunto de campos do formulário de abate
const formSchema = abateSchema.pick({
  data: true,
  fornecedorId: true,
  numeroAnimais: true,
  custoPorAnimal: true,
  condenado: true,
});
export type AbateFormValues = z.infer<typeof formSchema>;

// Inscrição em TODOS os abates (opcionalmente incluindo Cancelados)
export const subscribeToAbates = (
  callback: (abates: Abate[]) => void,
  includeInactive: boolean = false
) => {
  const q = query(collection(db, "abates"));
  return onSnapshot(
    q,
    (snapshot) => {
      const arr: Abate[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const toParse = {
          id: docSnap.id,
          ...data,
          data:
            data.data instanceof Timestamp
              ? data.data.toDate()
              : data.data,
        };
        const parsed = abateSchema.safeParse(toParse);
        if (parsed.success) arr.push(parsed.data);
        else
          console.error(
            "Abate inválido:",
            docSnap.id,
            parsed.error.format()
          );
      });
      const filtered = includeInactive
        ? arr
        : arr.filter((a) => a.status !== "Cancelado");
      // ordena do mais recente para o mais antigo
      filtered.sort(
        (a, b) => b.data.getTime() - a.data.getTime()
      );
      callback(filtered);
    },
    (err) => {
      console.error("Erro no listener de Abates:", err);
    }
  );
};

// Inscrição em abates dentro de um intervalo de datas
export const subscribeToAbatesByDateRange = (
  dateRange: DateRange | undefined,
  callback: (abates: Abate[]) => void
) => {
  // já filtra por não-cancelados
  const q = query(
    collection(db, "abates"),
    where("status", "!=", "Cancelado")
  );
  return onSnapshot(
    q,
    (snapshot) => {
      let arr: Abate[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const toParse = {
          id: docSnap.id,
          ...data,
          data:
            data.data instanceof Timestamp
              ? data.data.toDate()
              : data.data,
        };
        const parsed = abateSchema.safeParse(toParse);
        if (parsed.success) arr.push(parsed.data);
        else
          console.error(
            "Abate inválido (DateRange):",
            docSnap.id,
            parsed.error.format()
          );
      });

      if (dateRange?.from) {
        const fromTs = new Date(
          dateRange.from.setHours(0, 0, 0, 0)
        ).getTime();
        const toDate = dateRange.to || dateRange.from;
        const toTs = new Date(
          toDate.setHours(23, 59, 59, 999)
        ).getTime();
        arr = arr.filter((a) => {
          const t = a.data.getTime();
          return t >= fromTs && t <= toTs;
        });
      }

      arr.sort((a, b) => b.data.getTime() - a.data.getTime());
      callback(arr);
    },
    (err) => {
      console.error("Erro no listener de Abates (DateRange):", err);
    }
  );
};

// Adiciona um novo abate + conta a pagar em batch
export const addAbate = async (
  formValues: AbateFormValues,
  user: { uid: string; nome: string }
) => {
  const batch = writeBatch(db);
  const { data, fornecedorId, numeroAnimais, custoPorAnimal, condenado } = formValues;
  const custoTotal = numeroAnimais * custoPorAnimal;
  const loteId = `LOTE-${data.getTime()}`;

  // Documento de abate
  const abateRef = doc(collection(db, "abates"));
  batch.set(abateRef, {
    data: Timestamp.fromDate(data),
    fornecedorId,
    numeroAnimais,
    custoPorAnimal,
    condenado,
    custoTotal,
    loteId,
    registradoPor: user,
    status: "Aguardando Processamento",
    createdAt: serverTimestamp(),
  });

  // Conta a pagar automática
  const contaRef = doc(collection(db, "contasAPagar"));
  batch.set(contaRef, {
    abateId: abateRef.id,
    fornecedorId,
    descricao: `Abate lote ${loteId}`,
    valor: custoTotal,
    dataEmissao: Timestamp.fromDate(data),
    dataVencimento: Timestamp.fromDate(data),
    status: "Pendente",
    createdAt: serverTimestamp(),
  });

  await batch.commit();
};

// Atualiza os dados de um abate existente
export const updateAbate = async (
  id: string,
  formValues: Partial<AbateFormValues>
) => {
  const update: any = { ...formValues };
  if (formValues.data) {
    update.data = Timestamp.fromDate(formValues.data);
  }
  if (
    typeof formValues.numeroAnimais === "number" &&
    typeof formValues.custoPorAnimal === "number"
  ) {
    update.custoTotal =
      formValues.numeroAnimais * formValues.custoPorAnimal;
  }
  await updateDoc(doc(db, "abates", id), update);
};

// Muda manualmente o status de um abate
export const setAbateStatus = async (
  id: string,
  status:
    | "Aguardando Processamento"
    | "Em Processamento"
    | "Finalizado"
    | "Cancelado"
) => {
  await updateDoc(doc(db, "abates", id), { status });
};
