import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, serverTimestamp, query, where, Timestamp, addDoc, writeBatch } from "firebase/firestore";
import { Abate, abateSchema } from "@/lib/schemas";
import { z } from "zod";
import { DateRange } from "react-day-picker";

const formSchema = abateSchema.pick({
    data: true,
    fornecedorId: true,
    numeroAnimais: true,
    custoPorAnimal: true,
    condenado: true,
});
type AbateFormValues = z.infer<typeof formSchema>;

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
            };

            const parsed = abateSchema.safeParse(dataToParse);
            if (parsed.success) {
                abates.push(parsed.data);
            } else {
                console.error("Documento de abate inválido (subscribeToAbates):", doc.id, parsed.error.format());
            }
        });

        const filteredData = includeInactive
            ? abates
            : abates.filter(abate => abate.status !== 'Cancelado');

        callback(filteredData.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()));
    }, (error) => {
        console.error("Erro no listener de Abates (CRUD):", error);
    });
};

export const subscribeToAbatesByDateRange = (
    dateRange: DateRange | undefined,
    callback: (abates: Abate[]) => void
) => {
    const q = query(collection(db, "abates"), where("status", "!=", "Cancelado"));

    return onSnapshot(q, (querySnapshot) => {
        let abates: Abate[] = [];
        querySnapshot.forEach((doc) => {
            const docData = doc.data();
            const dataToParse = {
                id: doc.id,
                ...docData,
                data: docData.data instanceof Timestamp ? docData.data.toDate() : docData.data,
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
                const abateTime = new Date(abate.data).getTime();
                return abateTime >= fromTimestamp && abateTime <= toTimestamp;
            });
        }

        callback(filteredData.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()));
    }, (error) => {
        console.error("Erro no listener de Abates (DateRange):", error);
    });
};

export const addAbate = async (formValues: AbateFormValues, user: { uid: string; nome: string; }) => {
    try {
        const batch = writeBatch(db);

        const custoTotal = formValues.numeroAnimais * formValues.custoPorAnimal;
        const dataDoAbate = formValues.data;
        const loteId = `LOTE-${dataDoAbate.getTime()}`;

        const abateRef = doc(collection(db, "abates"));
        batch.set(abateRef, {
            ...formValues,
            loteId: loteId,
            custoTotal: custoTotal,
            data: Timestamp.fromDate(dataDoAbate),
            registradoPor: user,
            status: "Aguardando Processamento",
            createdAt: serverTimestamp(),
        });

        // CORREÇÃO: Alterado o nome da coleção para o padrão camelCase.
        const contaPagarRef = doc(collection(db, "contasAPagar"));
        batch.set(contaPagarRef, {
            abateId: abateRef.id,
            fornecedorId: formValues.fornecedorId,
            descricao: `Referente ao abate do ${loteId}`,
            valor: custoTotal,
            dataEmissao: Timestamp.fromDate(dataDoAbate),
            dataVencimento: Timestamp.fromDate(dataDoAbate),
            status: "Pendente",
            createdAt: serverTimestamp(),
        });

        await batch.commit();

    } catch (e) {
        console.error("Erro ao adicionar o lançamento de abate: ", e);
        throw new Error("Não foi possível adicionar o registro. Verifique o console.");
    }
};

export const updateAbate = async (id: string, formValues: Partial<AbateFormValues>) => {
    const dataToUpdate: { [key: string]: any } = { ...formValues };
    if (formValues.data) {
        dataToUpdate.data = Timestamp.fromDate(formValues.data);
    }
    if (formValues.numeroAnimais && formValues.custoPorAnimal) {
        dataToUpdate.custoTotal = formValues.numeroAnimais * formValues.custoPorAnimal;
    }
    const abateDoc = doc(db, "abates", id);
    await updateDoc(abateDoc, dataToUpdate);
};

export const setAbateStatus = async (id: string, status: 'Aguardando Processamento' | 'Em Processamento' | 'Finalizado' | 'Cancelado') => {
    const abateDoc = doc(db, "abates", id);
    await updateDoc(abateDoc, { status });
};
