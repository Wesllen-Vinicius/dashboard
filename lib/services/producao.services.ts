import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, serverTimestamp, query, Timestamp, runTransaction, increment, writeBatch } from "firebase/firestore";
import { Producao, producaoSchema } from "@/lib/schemas";

// Definição da coleção de lotes
const lotesCollection = collection(db, "lotes");
const producaoCollection = collection(db, "producao");

export const subscribeToProducoes = (
    callback: (producoes: Producao[]) => void,
    includeInactive: boolean = false
) => {
    const q = query(producaoCollection);

    return onSnapshot(q, (querySnapshot) => {
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
        callback(filteredData.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()));
    }, (error) => {
        console.error("Erro no listener de Produções:", error);
    });
};

// Função de adicionar produção MODIFICADA
export const addProducao = async (producaoData: Omit<Producao, 'id' | 'status' | 'createdAt'> & { lotesGerados?: any[] }) => {
    try {
        await runTransaction(db, async (transaction) => {
            const abateRef = doc(db, "abates", producaoData.abateId);
            const abateDoc = await transaction.get(abateRef);

            if (!abateDoc.exists()) {
                throw new Error("O lote de abate selecionado não foi encontrado.");
            }

            const abateStatus = abateDoc.data().status;
            if (abateStatus !== "Aguardando Processamento" && abateStatus !== "Em Processamento") {
                throw new Error(`Este lote de abate já foi finalizado ou cancelado.`);
            }

            // 1. Cria o registro de produção
            const { lotesGerados, ...restProducaoData } = producaoData;
            const producaoRef = doc(collection(db, "producao"));
            transaction.set(producaoRef, {
                ...restProducaoData,
                status: 'ativo',
                createdAt: serverTimestamp(),
                data: Timestamp.fromDate(producaoData.data),
            });

            // 2. Atualiza o estoque dos produtos
            for (const item of producaoData.produtos) {
                if (item.quantidade > 0) {
                    const produtoRef = doc(db, "produtos", item.produtoId);
                    transaction.update(produtoRef, {
                        quantidade: increment(item.quantidade)
                    });
                }
            }

            // 3. Salva os novos lotes gerados (NOVO)
            if (lotesGerados && lotesGerados.length > 0) {
                for (const lote of lotesGerados) {
                    const loteRef = doc(lotesCollection); // Cria um novo documento na coleção 'lotes'
                    transaction.set(loteRef, {
                        ...lote,
                        producaoId: producaoRef.id, // Vincula o lote à produção
                        dataProducao: Timestamp.fromDate(lote.dataProducao),
                        dataValidade: Timestamp.fromDate(lote.dataValidade),
                        createdAt: serverTimestamp(),
                    });
                }
            }

            // 4. Atualiza o status do abate
            transaction.update(abateRef, { status: "Em Processamento" });
        });
    } catch (error: any) {
        console.error("Erro na transação de produção: ", error);
        throw new Error(error.message || "Não foi possível registrar a produção.");
    }
};


export const updateProducao = async (id: string, producaoData: Partial<Omit<Producao, 'id'>>) => {
    const dataToUpdate: { [key: string]: any } = { ...producaoData };
    if (producaoData.data) {
        dataToUpdate.data = Timestamp.fromDate(producaoData.data as Date);
    }
    await updateDoc(doc(producaoCollection, id), dataToUpdate);
};

export const setProducaoStatus = async (id: string, status: 'ativo' | 'inativo') => {
    await updateDoc(doc(producaoCollection, id), { status });
};

// Listener para todos os lotes (NOVO)
export const subscribeToLotes = (
    callback: (lotes: any[]) => void // Substituir 'any' pelo schema do lote depois
) => {
    const q = query(lotesCollection);
    return onSnapshot(q, (querySnapshot) => {
        const lotes: any[] = [];
        querySnapshot.forEach((doc) => {
            lotes.push({ id: doc.id, ...doc.data() });
        });
        callback(lotes);
    });
};
