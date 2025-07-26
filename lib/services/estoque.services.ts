import { db } from "@/lib/firebase";
import { collection, doc, runTransaction, serverTimestamp, onSnapshot, query, orderBy, DocumentData, QuerySnapshot, Timestamp } from "firebase/firestore";
import { Movimentacao } from "@/lib/schemas";

type MovimentacaoPayload = Omit<Movimentacao, 'id' | 'data' | 'registradoPor'>;

/**
 * Registra uma movimentação manual de estoque de forma segura usando uma transação do lado do cliente.
 */
export const registrarMovimentacao = async (movimentacao: MovimentacaoPayload, user: { uid: string, nome: string }) => {
  const produtoRef = doc(db, "produtos", movimentacao.produtoId);
  const movimentacaoRef = doc(collection(db, "movimentacoesEstoque"));

  try {
    await runTransaction(db, async (transaction) => {
      const produtoDoc = await transaction.get(produtoRef);
      if (!produtoDoc.exists()) {
        throw new Error("Produto não encontrado!");
      }

      const estoqueAtual = produtoDoc.data().quantidade || 0;
      const quantidadeMovimentada = movimentacao.quantidade;

      let novoEstoque = estoqueAtual;
      if (movimentacao.tipo === 'entrada') {
        novoEstoque += quantidadeMovimentada;
      } else {
        novoEstoque -= quantidadeMovimentada;
        if (novoEstoque < 0) {
          throw new Error("Estoque insuficiente para realizar a saída.");
        }
      }

      // Atualiza a quantidade no documento do produto
      transaction.update(produtoRef, { quantidade: novoEstoque });

      // Cria o registro da movimentação
      transaction.set(movimentacaoRef, {
        ...movimentacao,
        data: serverTimestamp(),
        registradoPor: user,
      });
    });
  } catch (e: any) {
    console.error("Erro na transação de estoque: ", e);
    throw new Error(e.message || "Falha ao registrar a movimentação.");
  }
};


export const subscribeToMovimentacoes = (callback: (movs: Movimentacao[]) => void) => {
    const q = query(collection(db, "movimentacoesEstoque"), orderBy("data", "desc"));

    return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
      const movimentacoes: Movimentacao[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        movimentacoes.push({
            id: doc.id,
            ...data,
        } as Movimentacao);
      });
      callback(movimentacoes);
    });
};
