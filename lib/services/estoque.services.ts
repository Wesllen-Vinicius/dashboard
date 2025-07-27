// src/lib/services/estoque.services.ts
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  increment,
  Timestamp,
  DocumentData,
  QuerySnapshot,
} from "firebase/firestore";
import { Movimentacao, movimentacaoSchema } from "@/lib/schemas";
import { z } from "zod";

type MovimentacaoPayload = Omit<
  Movimentacao,
  "id" | "data" | "registradoPor" | "produtoNome"
>;

// referências às coleções
const produtosCol = collection(db, "produtos");
const movCol = collection(db, "movimentacoesEstoque");
const lotesCol = collection(db, "lotes");

/**
 * Registra uma movimentação de estoque de forma segura.
 * - Valida o payload via Zod
 * - Atualiza o estoque com increment atômico
 * - Insere o documento de movimentação, incluindo `produtoNome`
 */
export async function registrarMovimentacao(
  payload: MovimentacaoPayload,
  user: { uid: string; nome: string }
): Promise<void> {
  // validação do payload
  const parsed = movimentacaoSchema
    .omit({ id: true, data: true, registradoPor: true })
    .safeParse(payload);
  if (!parsed.success) {
    throw new Error(
      "Movimentação inválida: " +
        JSON.stringify(parsed.error.format(), null, 2)
    );
  }

  await runTransaction(db, async (tx) => {
    const prodRef = doc(produtosCol, payload.produtoId);
    const prodSnap = await tx.get(prodRef);
    if (!prodSnap.exists()) {
      throw new Error("Produto não encontrado.");
    }

    const prodData = prodSnap.data();
    const atual = prodData.quantidade ?? 0;
    const delta =
      payload.tipo === "entrada" ? payload.quantidade : -payload.quantidade;
    const novo = atual + delta;

    if (payload.tipo === "saida" && novo < 0) {
      throw new Error("Estoque insuficiente para esta saída.");
    }

    // 1. ajusta estoque
    tx.update(prodRef, { quantidade: increment(delta) });

    // 2. grava movimentação, incluindo o nome do produto
    const movRef = doc(movCol);
    tx.set(movRef, {
      ...payload,
      produtoNome: prodData.nome,          // <-- NOVO campo
      data: serverTimestamp(),
      registradoPor: user,
    });
  }).catch((err: any) => {
    console.error("Erro na transação de estoque:", err);
    throw new Error(err.message || "Falha ao registrar movimentação.");
  });
}

/**
 * Ouvinte de movimentações de estoque, já convertendo `Timestamp` em `Date`.
 */
export function subscribeToMovimentacoes(
  callback: (movs: Movimentacao[]) => void
) {
  const q = query(movCol, orderBy("data", "desc"));
  return onSnapshot(
    q,
    (snap: QuerySnapshot<DocumentData>) => {
      const arr: Movimentacao[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        arr.push({
          id: docSnap.id,
          produtoId: d.produtoId,
          produtoNome: d.produtoNome,             // já presente no documento
          quantidade: d.quantidade,
          tipo: d.tipo,
          motivo: d.motivo,
          registradoPor: d.registradoPor,
          data: (d.data as Timestamp).toDate(),
        });
      });
      callback(arr);
    },
    (err) => console.error("Erro no listener de movimentações:", err)
  );
}

/**
 * Ouvinte de lotes (útil caso você queira exibir por lote em estoque).
 */
export function subscribeToLotes(
  callback: (lotes: Array<Record<string, any>>) => void
) {
  return onSnapshot(
    lotesCol,
    (snap) => {
      const arr: Array<Record<string, any>> = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        arr.push({
          id: docSnap.id,
          ...d,
          dataProducao: (d.dataProducao as Timestamp).toDate(),
          dataValidade: (d.dataValidade as Timestamp).toDate(),
        });
      });
      callback(arr);
    },
    (err) => console.error("Erro no listener de lotes:", err)
  );
}
