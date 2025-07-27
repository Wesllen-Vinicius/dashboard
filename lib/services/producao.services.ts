// src/lib/services/producao.services.ts
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  Timestamp,
  runTransaction,
  increment,
} from "firebase/firestore";
import { Producao, producaoSchema } from "@/lib/schemas";

// coleções referenciadas
const lotesCollection      = collection(db, "lotes");
const producaoCollection   = collection(db, "producao");
const movEstoqueCollection = collection(db, "movimentacoesEstoque");

/**
 * Inscreve em todas as produções, opcionalmente filtrando só as ativas.
 */
export const subscribeToProducoes = (
  callback: (producoes: Producao[]) => void,
  includeInactive: boolean = false
) => {
  const q = query(producaoCollection);
  return onSnapshot(
    q,
    (snapshot) => {
      const producoes: Producao[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const toParse = {
          id: docSnap.id,
          ...data,
          data:
            data.data instanceof Timestamp
              ? data.data.toDate()
              : data.data,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : data.createdAt,
        };
        const parsed = producaoSchema.safeParse(toParse);
        if (parsed.success) producoes.push(parsed.data);
        else
          console.error(
            "Produção inválida:",
            docSnap.id,
            parsed.error.format()
          );
      });

      const filtered = includeInactive
        ? producoes
        : producoes.filter((p) => p.status === "ativo");

      callback(
        filtered.sort((a, b) => b.data.getTime() - a.data.getTime())
      );
    },
    (err) => console.error("Erro no listener de Produções:", err)
  );
};

/**
 * Registra uma nova produção:
 * 1) Confere que o abate está "Aguardando Processamento"
 * 2) Cria o documento de produção
 * 3) Atualiza o estoque + registra cada entrada no histórico
 * 4) Gera lotes derivados (se houver)
 * 5) Marca o abate como "Finalizado"
 */
export const addProducao = async (
  producaoData: Omit<Producao, "id" | "status" | "createdAt"> & {
    lotesGerados?: any[];
  }
) => {
  try {
    await runTransaction(db, async (tx) => {
      // 0) Referência ao abate
      const abateRef = doc(db, "abates", producaoData.abateId);
      const abateSnap = await tx.get(abateRef);
      if (!abateSnap.exists()) {
        throw new Error("O lote de abate não foi encontrado.");
      }
      const statusAtual = abateSnap.data().status;
      if (statusAtual !== "Aguardando Processamento") {
        throw new Error("Este abate já foi finalizado ou cancelado.");
      }

      // 1) Cria o registro de produção
      const { lotesGerados, ...rest } = producaoData;
      const prodRef = doc(producaoCollection);
      tx.set(prodRef, {
        ...rest,
        status:    "ativo",
        createdAt: serverTimestamp(),
        data:      Timestamp.fromDate(producaoData.data),
      });

      // 2) Para cada item: atualiza estoque e registra entrada
      for (const item of producaoData.produtos) {
        if (item.quantidade > 0) {
          // 2a) atualiza quantidade no produto
          const prodDocRef = doc(db, "produtos", item.produtoId);
          tx.update(prodDocRef, {
            quantidade: increment(item.quantidade),
          });

          // 2b) grava movimentação de entrada no estoque
          const movRef = doc(movEstoqueCollection);
          tx.set(movRef, {
            produtoId:     item.produtoId,
            produtoNome:   item.produtoNome!,           // esperado no payload
            quantidade:    item.quantidade,
            tipo:          "entrada",
            motivo:        `Produção ${producaoData.lote}`,
            registradoPor: producaoData.registradoPor,  // esperado no payload
            data:          serverTimestamp(),
          });
        }
      }

      // 3) Grava lotes derivados (se houver)
      if (lotesGerados?.length) {
        for (const lote of lotesGerados) {
          const loteRef = doc(lotesCollection);
          tx.set(loteRef, {
            ...lote,
            producaoId:   prodRef.id,
            dataProducao: Timestamp.fromDate(lote.dataProducao),
            dataValidade: Timestamp.fromDate(lote.dataValidade),
            createdAt:    serverTimestamp(),
          });
        }
      }

      // 4) Finaliza o abate
      tx.update(abateRef, { status: "Finalizado" });
    });
  } catch (err: any) {
    console.error("Erro na transação de produção:", err);
    throw new Error(err.message || "Não foi possível registrar a produção.");
  }
};

/**
 * Atualiza campos de uma produção já existente.
 */
export const updateProducao = async (
  id: string,
  producaoData: Partial<Omit<Producao, "id">>
) => {
  const dataToUpdate: any = { ...producaoData };
  if (producaoData.data) {
    dataToUpdate.data = Timestamp.fromDate(
      producaoData.data as Date
    );
  }
  await updateDoc(doc(producaoCollection, id), dataToUpdate);
};

/**
 * Ativa / Inativa uma produção (sem tocar no abate).
 */
export const setProducaoStatus = async (
  id: string,
  status: "ativo" | "inativo"
) => {
  await updateDoc(doc(producaoCollection, id), { status });
};

/**
 * Inscreve em todos os lotes gerados.
 */
export const subscribeToLotes = (
  callback: (lotes: any[]) => void
) => {
  return onSnapshot(
    query(lotesCollection),
    (snapshot) => {
      const arr: any[] = [];
      snapshot.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      callback(arr);
    },
    (err) => console.error("Erro no listener de lotes:", err)
  );
};
