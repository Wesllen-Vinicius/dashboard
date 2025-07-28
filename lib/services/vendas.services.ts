// lib/services/vendas.services.ts
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  updateDoc,
  query,
  orderBy,
  Timestamp,
  runTransaction,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { Venda } from "@/lib/schemas";

/**
 * Registra uma nova venda, baixa estoque e cria movimentação/conta a receber.
 * Adaptação total para integração com NF-e (e futuras integrações).
 */
export const registrarVenda = async (
  vendaData: Omit<Venda, "id" | "status">,
  clienteNome: string
) => {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Validação de estoque para todos os produtos
      for (const item of vendaData.produtos) {
        const produtoRef = doc(db, "produtos", item.produtoId);
        const produtoDoc = await transaction.get(produtoRef);
        if (!produtoDoc.exists()) {
          throw new Error(
            `Produto "${item.produtoNome}" não encontrado no estoque.`
          );
        }
        const estoqueAtual = produtoDoc.data().quantidade || 0;
        if (estoqueAtual < item.quantidade) {
          throw new Error(
            `Estoque insuficiente para "${item.produtoNome}". Disponível: ${estoqueAtual}`
          );
        }
      }

      // 2. Cria o registro da Venda (status default: Paga/A_Prazo)
      const vendaRef = doc(collection(db, "vendas"));
      transaction.set(vendaRef, {
        ...vendaData,
        status: vendaData.condicaoPagamento === "A_VISTA" ? "Paga" : "Pendente",
        data: Timestamp.fromDate(vendaData.data as Date),
        dataVencimento: vendaData.dataVencimento
          ? Timestamp.fromDate(vendaData.dataVencimento as Date)
          : null,
        // nfe: não é setado no registro inicial, apenas na emissão!
      });

      // 3. Baixa no estoque e movimentação
      for (const item of vendaData.produtos) {
        const produtoRef = doc(db, "produtos", item.produtoId);
        transaction.update(produtoRef, {
          quantidade: increment(-item.quantidade),
        });

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

      // 4. Conta a receber se venda a prazo
      if (vendaData.condicaoPagamento === "A_PRAZO") {
        const contaReceberRef = doc(collection(db, "contasAReceber"));
        transaction.set(contaReceberRef, {
          vendaId: vendaRef.id,
          clienteId: vendaData.clienteId,
          clienteNome: clienteNome,
          valor: vendaData.valorFinal || vendaData.valorTotal,
          dataEmissao: Timestamp.fromDate(vendaData.data as Date),
          dataVencimento: Timestamp.fromDate(
            vendaData.dataVencimento as Date
          ),
          status: "Pendente",
        });
      }
    });
  } catch (error: any) {
    console.error("Erro na transação de venda: ", error);
    throw new Error(error.message || "Falha ao registrar a venda.");
  }
};

/**
 * Assinatura em tempo real para vendas
 * - Inclui data e dataVencimento convertidas para Date.
 * - O campo nfe será lido corretamente (se presente).
 */
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
        // nfe: já vem do Firestore se existir!
      } as Venda);
    });
    callback(vendas);
  });
};

/**
 * Atualiza status da venda ('Paga' ou 'Pendente')
 */
export const updateVendaStatus = async (
  id: string,
  status: "Paga" | "Pendente"
) => {
  const vendaDoc = doc(db, "vendas", id);
  await updateDoc(vendaDoc, { status });
};

/**
 * Atualiza qualquer campo da venda, inclusive o objeto 'nfe'.
 * - Usado para salvar dados da NF-e retornados pela API de emissão.
 */
export const updateVenda = async (
  id: string,
  vendaData: Partial<Omit<Venda, "id">>
) => {
  const vendaDocRef = doc(db, "vendas", id);
  const dataToUpdate: { [key: string]: any } = { ...vendaData };

  if (vendaData.data) {
    dataToUpdate.data = Timestamp.fromDate(vendaData.data as Date);
  }
  if (vendaData.dataVencimento) {
    dataToUpdate.dataVencimento = Timestamp.fromDate(
      vendaData.dataVencimento as Date
    );
  } else if (vendaData.hasOwnProperty("dataVencimento")) {
    dataToUpdate.dataVencimento = null;
  }

  // Permite atualizar/definir o campo 'nfe' de forma segura
  if (vendaData.nfe !== undefined) {
    dataToUpdate.nfe = vendaData.nfe;
  }

  await updateDoc(vendaDocRef, dataToUpdate);
};
