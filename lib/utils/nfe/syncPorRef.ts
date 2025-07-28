import { consultarNFe } from "@/lib/services/nfe.services";
import { updateVenda } from "@/lib/services/vendas.services";

/**
 * Sincroniza uma única nota fiscal a partir da ref (ID da venda).
 */
export async function syncNotaFiscalPorRef(ref: string): Promise<void> {
  try {
    console.log(`🔄 Sincronizando NF-e ${ref}...`);

    const resultado = await consultarNFe(ref);

    if (!resultado?.status) {
      console.warn(`⚠️ Nenhum dado de NF-e encontrado para ${ref}`);
      return;
    }

    const nfeUpdateData = Object.fromEntries(
      Object.entries({
        id: resultado.ref ?? ref,
        status: resultado.status,
        url_danfe: resultado.ref ? `/pdf/${resultado.ref}` : null,
        url_xml: resultado.caminho_xml_nota_fiscal ?? resultado.url_xml ?? undefined,
        chave: resultado.chave ?? resultado.chave_nfe ?? undefined,
        protocolo: resultado.protocolo ?? undefined,
        dataEmissao: resultado.data_emissao
          ? new Date(resultado.data_emissao)
          : undefined,
        motivo: resultado.motivo ?? undefined,
      }).filter(([, v]) => v !== undefined)
    );

    await updateVenda(ref, { nfe: nfeUpdateData });

    console.log(`✅ NF-e ${ref} sincronizada com status: ${resultado.status}`);
  } catch (error: any) {
    console.error(`❌ Erro ao sincronizar NF-e ${ref}:`, error.message || error);
  }
}
