import { Venda, CompanyInfo, Cliente, Produto, Unidade } from "@/lib/schemas";
import axios from "axios";

export interface NFEResult {
  status?: string;
  ref?: string;
  id?: string;
  chave?: string;
  protocolo?: string;
  url_danfe?: string;
  url_xml?: string;
  motivo?: string;
  chave_nfe?: string;
  data_emissao?: string;
  caminho_danfe?: string;
  caminho_xml_nota_fiscal?: string;
  mensagem_sefaz?: string;
  erros?: { mensagem: string }[];
}

/**
 * Tratamento unificado de erros para todas as chamadas.
 */
function tratarErroAPI(error: any, acao: string): never {
  console.error(`❌ Erro ao ${acao}:`, error.response?.data || error.message);
  throw new Error(
    error.response?.data?.message ||
    error.response?.data?.mensagem ||
    "Falha na comunicação com o servidor de NF-e."
  );
}

/**
 * Emite uma Nota Fiscal Eletrônica via API interna.
 */
export const emitirNFe = async (
  venda: Venda,
  empresa: CompanyInfo,
  cliente: Cliente,
  todosProdutos: Produto[],
  todasUnidades: Unidade[]
): Promise<NFEResult> => {
  try {
    const { data } = await axios.post<NFEResult>("/api/nfe/emitir", {
      venda,
      empresa,
      cliente,
      todosProdutos,
      todasUnidades,
    });

    return {
      status: data.status || "erro_autorizacao",
      ref: data.ref,
      url_danfe: data.ref ? `/pdf/${data.ref}` : undefined, // ✅ Link funcional no sistema
      url_xml: data.caminho_xml_nota_fiscal,
      mensagem_sefaz: data.mensagem_sefaz,
      erros: data.erros || [],
    };
  } catch (error: any) {
    tratarErroAPI(error, "emitir NF-e");
  }
};

/**
 * Consulta o status de uma NF-e via API interna.
 */
export const consultarNFe = async (ref: string): Promise<NFEResult> => {
  try {
    const { data } = await axios.get<NFEResult>(`/api/nfe/consultar?ref=${ref}`);
    return {
      status: data.status || "erro_autorizacao",
      ref: data.ref || ref,
      url_danfe: data.ref ? `/pdf/${data.ref}` : undefined, // ✅ Aqui também
      url_xml: data.url_xml,
      mensagem_sefaz: data.mensagem_sefaz,
    };
  } catch (error: any) {
    tratarErroAPI(error, "consultar NF-e");
  }
};

/**
 * Cancela uma NF-e via API interna.
 */
export const cancelarNFe = async (
  ref: string,
  justificativa: string
): Promise<NFEResult> => {
  try {
    const { data } = await axios.delete<NFEResult>("/api/nfe/cancelar", {
      data: { ref, justificativa },
    });

    return {
      status: data.status || "erro_cancelamento",
      ref: data.ref || ref,
      mensagem_sefaz: data.mensagem_sefaz,
      erros: data.erros || [],
    };
  } catch (error: any) {
    tratarErroAPI(error, "cancelar NF-e");
  }
};
