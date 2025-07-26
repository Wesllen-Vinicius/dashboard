import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// Interface para os dados recebidos do formulário
interface LancarAbateData {
  fornecedorId: string;
  numeroAnimais: number;
  custoPorAnimal: number;
  condenado?: number;
  dataAbate: string; // A data vem como string no formato ISO
  registradoPor: {
    uid: string;
    nome: string;
  };
}

export const lancarAbate = functions.https.onCall(async (request: functions.https.CallableRequest<LancarAbateData>) => {
  // A autenticação agora é verificada através de 'request.auth'
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Você precisa estar autenticado para realizar esta ação."
    );
  }

  // Os dados do formulário vêm em 'request.data'
  const {
    fornecedorId,
    numeroAnimais,
    custoPorAnimal,
    condenado,
    dataAbate,
    registradoPor,
  } = request.data;

  if (!fornecedorId || !numeroAnimais || !custoPorAnimal || !dataAbate) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Dados incompletos. Verifique o formulário."
    );
  }

  const custoTotal = numeroAnimais * custoPorAnimal;
  const dataDoAbate = new Date(dataAbate);
  const loteId = `LOTE-${dataDoAbate.getTime()}`;

  const batch = db.batch();

  try {
    const abateRef = db.collection("abates").doc();
    batch.set(abateRef, {
      loteId: loteId,
      data: admin.firestore.Timestamp.fromDate(dataDoAbate),
      fornecedorId: fornecedorId,
      numeroAnimais: numeroAnimais,
      custoPorAnimal: custoPorAnimal,
      custoTotal: custoTotal,
      condenado: condenado || 0,
      registradoPor: registradoPor,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "Aguardando Processamento",
    });

    const contaPagarRef = db.collection("contas_a_pagar").doc();
    batch.set(contaPagarRef, {
      abateId: abateRef.id,
      fornecedorId: fornecedorId,
      descricao: `Referente ao abate do ${loteId}`,
      valor: custoTotal,
      dataEmissao: admin.firestore.Timestamp.fromDate(dataDoAbate),
      dataVencimento: admin.firestore.Timestamp.fromDate(dataDoAbate),
      status: "Pendente",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return { success: true, message: "Lançamento de abate criado com sucesso!" };
  } catch (error) {
    console.error("Erro ao executar o lançamento de abate:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Ocorreu um erro no servidor ao tentar criar o lançamento.",
      error
    );
  }
});
