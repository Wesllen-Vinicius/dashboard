import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, serverTimestamp, Query, query, where, QuerySnapshot, DocumentData, Timestamp, addDoc } from "firebase/firestore";
import { Compra, compraSchema } from "@/lib/schemas";
import { DateRange } from "react-day-picker";

// Para a página de Compras (CRUD)
export const subscribeToCompras = (callback: (compras: Compra[]) => void, includeInactive: boolean = false) => {
    const q = query(collection(db, "compras"));

    return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
        const compras: Compra[] = [];
        querySnapshot.forEach((doc) => {
            const docData = doc.data();
            const dataToParse = {
                id: doc.id,
                ...docData,
                data: docData.data instanceof Timestamp ? docData.data.toDate() : docData.data,
                dataPrimeiroVencimento: docData.dataPrimeiroVencimento instanceof Timestamp ? docData.dataPrimeiroVencimento.toDate() : docData.dataPrimeiroVencimento,
                createdAt: docData.createdAt instanceof Timestamp ? docData.createdAt.toDate() : docData.createdAt,
            };

            const parsed = compraSchema.safeParse(dataToParse);
            if (parsed.success) {
                compras.push(parsed.data);
            } else {
                console.error("Documento de compra inválido:", doc.id, parsed.error.format());
            }
        });

        const filteredData = includeInactive ? compras : compras.filter(compra => compra.status === 'ativo');
        callback(filteredData.sort((a, b) => b.data.getTime() - a.data.getTime()));
    }, (error) => {
        console.error("Erro no listener de Compras:", error);
    });
};

// Para a data.store.ts (Dashboard)
export const subscribeToComprasByDateRange = (dateRange: DateRange | undefined, callback: (compras: Compra[]) => void) => {
    const q = query(collection(db, "compras"), where("status", "==", "ativo"));

    return onSnapshot(q, (querySnapshot) => {
        let compras: Compra[] = [];
        querySnapshot.forEach((doc) => {
            const docData = doc.data();
             const dataToParse = {
                id: doc.id,
                ...docData,
                data: docData.data instanceof Timestamp ? docData.data.toDate() : docData.data,
                dataPrimeiroVencimento: docData.dataPrimeiroVencimento instanceof Timestamp ? docData.dataPrimeiroVencimento.toDate() : docData.dataPrimeiroVencimento,
                createdAt: docData.createdAt instanceof Timestamp ? docData.createdAt.toDate() : docData.createdAt,
            };

            const parsed = compraSchema.safeParse(dataToParse);
            if (parsed.success) {
                compras.push(parsed.data);
            } else {
                console.error("Documento de compra inválido (DateRange):", doc.id, parsed.error.format());
            }
        });

        let filteredData = compras;

        if (dateRange?.from) {
            const toDate = dateRange.to || dateRange.from;
            const fromTimestamp = new Date(dateRange.from.setHours(0, 0, 0, 0)).getTime();
            const toTimestamp = new Date(toDate.setHours(23, 59, 59, 999)).getTime();
            filteredData = filteredData.filter(compra => {
                const compraTime = compra.data.getTime();
                return compraTime >= fromTimestamp && compraTime <= toTimestamp;
            });
        }
        callback(filteredData.sort((a, b) => b.data.getTime() - a.data.getTime()));
    }, (error) => {
        console.error("Erro no listener de Compras (DateRange):", error);
    });
};

export const addCompra = async (compraData: Omit<Compra, 'id' | 'status' | 'createdAt'>) => {
    const dataToSave: any = {
        ...compraData,
        status: 'ativo',
        createdAt: serverTimestamp(),
        data: Timestamp.fromDate(compraData.data),
    };

    if (compraData.condicaoPagamento === 'A_PRAZO' && compraData.dataPrimeiroVencimento) {
        dataToSave.dataPrimeiroVencimento = Timestamp.fromDate(compraData.dataPrimeiroVencimento);
    } else {
        delete dataToSave.dataPrimeiroVencimento;
        delete dataToSave.numeroParcelas;
    }

    await addDoc(collection(db, "compras"), dataToSave);
};

export const updateCompra = async (id: string, compraData: Partial<Omit<Compra, 'id'>>) => {
    const dataToUpdate: { [key: string]: any } = { ...compraData };
    if (compraData.data) {
        dataToUpdate.data = Timestamp.fromDate(compraData.data);
    }

    if (compraData.condicaoPagamento === 'A_PRAZO' && compraData.dataPrimeiroVencimento) {
        dataToUpdate.dataPrimeiroVencimento = Timestamp.fromDate(compraData.dataPrimeiroVencimento);
    } else {
        dataToUpdate.dataPrimeiroVencimento = null;
        dataToUpdate.numeroParcelas = null;
    }

    await updateDoc(doc(db, "compras", id), dataToUpdate);
};

export const setCompraStatus = async (id: string, status: 'ativo' | 'inativo') => {
    await updateDoc(doc(db, "compras", id), { status });
};
