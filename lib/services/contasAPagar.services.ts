// src/lib/services/contasAPagar.services.ts

import { db, functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { z } from "zod";

/**
 * Schema de validação de uma Conta a Pagar
 */
const contaSchema = z.object({
  id: z.string(),
  abateId: z.string().optional(),
  valor: z.number(),
  status: z.enum(["Pendente", "Paga"]),
  descricao: z.string(),
  dataEmissao: z.date(),
  dataVencimento: z.date(),
  createdAt: z.date().optional(),
  despesaId: z.string().nullable().optional(),
});
export type ContaAPagar = z.infer<typeof contaSchema>;

/**
 * Inscreve num listener que retorna todas as contas a pagar,
 * ordenadas por data de vencimento ascendente.
 */
export const subscribeToContasAPagar = (
  callback: (contas: ContaAPagar[]) => void
) => {
  const q = query(
    collection(db, "contasAPagar"),
    orderBy("dataVencimento", "asc")
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const contas: ContaAPagar[] = [];
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const conta = {
          id: docSnap.id,
          abateId: data.abateId,
          valor: data.valor,
          status: data.status,
          descricao: data.descricao,
          dataEmissao:
            data.dataEmissao instanceof Timestamp
              ? data.dataEmissao.toDate()
              : data.dataEmissao,
          dataVencimento:
            data.dataVencimento instanceof Timestamp
              ? data.dataVencimento.toDate()
              : data.dataVencimento,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : data.createdAt,
          despesaId: data.despesaId ?? null,
        };
        // Só adiciona se passar no Zod
        if (contaSchema.safeParse(conta).success) {
          contas.push(conta);
        } else {
          console.error("Conta inválida:", docSnap.id);
        }
      });
      callback(contas);
    },
    (err) => console.error("Erro no listener de Contas a Pagar:", err)
  );
};

/**
 * Executa a baixa de uma conta a pagar via Cloud Function.
 * A Cloud Function deve tratar a transação completa (debitar conta bancária,
 * mudar status, registrar histórico, etc).
 *
 * @param conta - o objeto da conta a pagar
 * @param contaBancariaId - ID da conta bancária de onde debitar
 */
export const pagarConta = async (
  conta: ContaAPagar,
  contaBancariaId: string
) => {
  const pagarContaFn = httpsCallable(functions, "pagarContaHttps");
  try {
    await pagarContaFn({
      contaId: conta.id,
      contaBancariaId,
      despesaId: conta.despesaId ?? null,
    });
  } catch (err: any) {
    console.error("Erro ao chamar Cloud Function pagarContaHttps:", err);
    throw new Error(err.message || "Falha ao processar pagamento.");
  }
};

/**
 * Marca manualmente uma conta a pagar como Paga ou Pendente.
 * Útil para ajustes sem passar pela Cloud Function.
 */
export const setContaAPagarStatus = async (
  contaId: string,
  status: "Pendente" | "Paga"
) => {
  const ref = doc(db, "contasAPagar", contaId);
  await updateDoc(ref, { status });
};
