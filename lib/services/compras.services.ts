import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  Timestamp,
  doc,
  updateDoc,
  writeBatch,
  serverTimestamp
} from "firebase/firestore";
import { DateRange } from "react-day-picker";

import { Compra, compraSchema, UserInfo } from "@/lib/schemas";

// Tipagem para os dados que vêm do formulário
type CompraFormValues = Omit<Compra, 'id' | 'createdAt' | 'status' | 'registradoPor'>;

/**
 * Adiciona um novo documento de compra na coleção 'compras'.
 * @param data - Os dados da compra validados pelo formulário.
 * @param user - Informações do usuário que está registrando.
 */
export const addCompra = async (data: CompraFormValues, user: UserInfo) => {
  try {
    // Valida e prepara os dados para o Firestore
    const validatedData = compraSchema.parse(data);

    // Cria um batch para garantir a escrita atômica
    const batch = writeBatch(db);
    const compraRef = doc(collection(db, "compras"));

    const newCompraData = {
      ...validatedData,
      registradoPor: user,
      status: 'ativo',
      createdAt: serverTimestamp(), // Usa o timestamp do servidor
    };

    batch.set(compraRef, newCompraData);

    // TODO: Adicionar lógica para atualizar o estoque de matéria-prima, se aplicável
    // Ex: if (validatedData.tipo === 'materia-prima') { ... }

    await batch.commit();

  } catch (error) {
    console.error("Erro ao adicionar nova compra: ", error);
    if (error instanceof Error) {
        throw new Error(`Falha ao registrar a compra: ${error.message}`);
    }
    throw new Error("Falha ao registrar a compra por um erro desconhecido.");
  }
};

/**
 * Atualiza um documento de compra existente.
 * @param id - O ID do documento da compra a ser atualizado.
 * @param data - Os dados a serem atualizados.
 */
export const updateCompra = async (id: string, data: Partial<CompraFormValues>) => {
    try {
        const compraRef = doc(db, "compras", id);

        // O zod não é usado aqui para permitir atualizações parciais,
        // mas a validação ainda acontece no formulário.
        const updateData = {
            ...data,
            // Converte a data do formulário para Timestamp do Firestore, se existir
            ...(data.data && { data: Timestamp.fromDate(new Date(data.data)) })
        };

        await updateDoc(compraRef, updateData);
    } catch (error) {
        console.error("Erro ao atualizar a compra: ", error);
        throw new Error("Falha ao atualizar a compra.");
    }
};

/**
 * Altera o status de uma compra (ex: para 'inativo').
 * @param id - O ID da compra a ser modificada.
 * @param status - O novo status ('ativo' ou 'inativo').
 */
export const setCompraStatus = async (id: string, status: 'ativo' | 'inativo') => {
    try {
        const compraRef = doc(db, "compras", id);
        await updateDoc(compraRef, { status });
    } catch (error) {
        console.error("Erro ao inativar a compra: ", error);
        throw new Error("Falha ao inativar a compra.");
    }
};

/**
 * Cria uma inscrição (listener) para a coleção de compras, filtrando por status e um intervalo de datas opcional.
 * @param dateRange - O intervalo de datas para filtrar os resultados.
 * @param callback - A função que será chamada com os dados atualizados.
 * @returns Uma função para cancelar a inscrição (unsubscribe).
 */
export const subscribeToComprasByDateRange = (
  dateRange: DateRange | undefined,
  callback: (compras: Compra[]) => void
) => {
    // Começa com a consulta base, sempre filtrando por compras ativas
    let q = query(collection(db, "compras"), where("status", "==", "ativo"));

    // Adiciona o filtro de data, se fornecido
    if (dateRange?.from && dateRange?.to) {
        const start = Timestamp.fromDate(dateRange.from);
        const end = Timestamp.fromDate(dateRange.to);
        q = query(q, where("data", ">=", start), where("data", "<=", end));
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const compras: Compra[] = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                // Garante que o campo 'data' seja um objeto Date do JS
                data: (data.data as Timestamp).toDate(),
            } as Compra;
        });

        // Ordena pela data da compra, da mais recente para a mais antiga
        callback(compras.sort((a, b) => b.data.getTime() - a.data.getTime()));
    }, (error) => {
        console.error("Erro ao buscar compras: ", error);
        // Em caso de erro, retorna uma lista vazia para não quebrar a UI
        callback([]);
    });

    return unsubscribe;
};
