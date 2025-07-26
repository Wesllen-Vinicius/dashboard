import { db } from "@/lib/firebase";
import { collection, doc, onSnapshot, QuerySnapshot, DocumentData, updateDoc, query, orderBy, Timestamp, runTransaction, increment, serverTimestamp } from "firebase/firestore";
import { Venda } from "@/lib/schemas";

export const registrarVenda = async (vendaData: Omit<Venda, 'id' | 'status'>, clienteNome: string) => {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Validação de estoque para todos os produtos da venda
      for (const item of vendaData.produtos) {
        const produtoRef = doc(db, "produtos", item.produtoId);
        const produtoDoc = await transaction.get(produtoRef);
        if (!produtoDoc.exists()) {
          throw new Error(`Produto "${item.produtoNome}" não encontrado no estoque.`);
        }
        const estoqueAtual = produtoDoc.data().quantidade || 0;
        if (estoqueAtual < item.quantidade) {
          throw new Error(`Estoque insuficiente para "${item.produtoNome}". Disponível: ${estoqueAtual}`);
        }
      }

      // 2. Cria o registro da Venda
      const vendaRef = doc(collection(db, "vendas"));
      transaction.set(vendaRef, {
        ...vendaData,
        status: vendaData.condicaoPagamento === 'A_VISTA' ? 'Paga' : 'Pendente',
        data: Timestamp.fromDate(vendaData.data as Date),
        dataVencimento: vendaData.dataVencimento ? Timestamp.fromDate(vendaData.dataVencimento as Date) : null,
      });

      // 3. Dá baixa no estoque e registra a movimentação para cada produto
      for (const item of vendaData.produtos) {
        const produtoRef = doc(db, "produtos", item.produtoId);
        // Usa 'increment' com valor negativo para dar a baixa
        transaction.update(produtoRef, { quantidade: increment(-item.quantidade) });

        // Cria o registro da movimentação de saída
        const movimentacaoRef = doc(collection(db, "movimentacoesEstoque"));
        transaction.set(movimentacaoRef, {
          produtoId: item.produtoId,
          produtoNome: item.produtoNome,
          quantidade: item.quantidade,
          tipo: "saida",
          motivo: `Venda para ${clienteNome} (Ref: ${vendaRef.id})`,
          data: serverTimestamp(),
          registradoPor: vendaData.registradoPor,
        });
      }

      // 4. Se a venda for "A Prazo", cria a Conta a Receber
      if (vendaData.condicaoPagamento === 'A_PRAZO') {
        const contaReceberRef = doc(collection(db, "contasAReceber"));
        transaction.set(contaReceberRef, {
          vendaId: vendaRef.id,
          clienteId: vendaData.clienteId,
          clienteNome: clienteNome,
          valor: vendaData.valorFinal || vendaData.valorTotal,
          dataEmissao: Timestamp.fromDate(vendaData.data as Date),
          dataVencimento: Timestamp.fromDate(vendaData.dataVencimento as Date),
          status: 'Pendente',
        });
      }
    });
  } catch (error: any) {
    console.error("Erro na transação de venda: ", error);
    throw new Error(error.message || "Falha ao registrar a venda.");
  }
};

export const subscribeToVendas = (callback: (vendas: Venda[]) => void) => {
  const q = query(collection(db, "vendas"), orderBy("data", "desc"));
  return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
    const vendas: Venda[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        vendas.push({
            ...data,
            id: doc.id,
            data: data.data.toDate(),
            dataVencimento: data.dataVencimento?.toDate(),
        } as Venda);
    });
    callback(vendas);
  });
};

export const updateVendaStatus = async (id: string, status: 'Paga' | 'Pendente') => {
  const vendaDoc = doc(db, "vendas", id);
  await updateDoc(vendaDoc, { status });
};

export const updateVenda = async (id: string, vendaData: Partial<Omit<Venda, 'id'>>) => {
    const vendaDocRef = doc(db, "vendas", id);
    const dataToUpdate: { [key: string]: any } = { ...vendaData };

    if (vendaData.data) {
        dataToUpdate.data = Timestamp.fromDate(vendaData.data as Date);
    }
    if (vendaData.dataVencimento) {
        dataToUpdate.dataVencimento = Timestamp.fromDate(vendaData.dataVencimento as Date);
    } else if (vendaData.hasOwnProperty('dataVencimento')) {
        dataToUpdate.dataVencimento = null;
    }

    await updateDoc(vendaDocRef, dataToUpdate);
}
