import { consultarNFe } from "@/lib/services/nfe.services";
import { updateVenda } from "@/lib/services/vendas.services";
import { Venda } from "@/lib/schemas";
import { useDataStore } from "@/store/data.store";

/**
 * Sincroniza as vendas sem dados de NF-e com a Focus NFe.
 * - Verifica vendas que NÃO têm nfe ou estão com status indefinido
 * - Consulta a Focus NFe
 * - Atualiza a venda com os dados da NFe
 */
export async function syncNotasFiscais(): Promise<void> {
  const { vendas } = useDataStore.getState();

  console.log(`🔄 Iniciando sincronização de NF-e para ${vendas.length} vendas...`);

  const vendasParaSincronizar = vendas.filter(
    (v: Venda) => !v.nfe?.status || !v.nfe?.id
  );

  for (const venda of vendasParaSincronizar) {
    try {
      console.log(`🔎 Consultando NF-e para venda ${venda.id}...`);
      const resultado = await consultarNFe(venda.id!);

      if (resultado?.status) {
        const nfeUpdateData = {
          id: resultado.ref ?? venda.nfe?.id ?? venda.id,
          status: resultado.status,
          url_danfe:
            resultado.caminho_danfe || resultado.url_danfe || undefined,
          url_xml:
            resultado.caminho_xml_nota_fiscal || resultado.url_xml || undefined,
          chave: resultado.chave_nfe || resultado.chave || undefined,
          protocolo: resultado.protocolo || undefined,
          dataEmissao: resultado.data_emissao
            ? new Date(resultado.data_emissao)
            : undefined,
          motivo: resultado.motivo || undefined,
        };

        await updateVenda(venda.id!, { nfe: nfeUpdateData });
        console.log(
          `✅ Venda ${venda.id} sincronizada com status: ${resultado.status}`
        );
      } else {
        console.warn(`⚠️ Nenhum dado de NF-e encontrado para venda ${venda.id}`);
      }
    } catch (error: any) {
      console.error(
        `❌ Erro ao sincronizar NF-e da venda ${venda.id}:`,
        error.message
      );
    }
  }

  console.log("✅ Sincronização concluída.");
}
