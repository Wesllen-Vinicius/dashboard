import { Venda, CompanyInfo, Cliente, Produto, Unidade, ItemVendido } from "@/lib/schemas";
import { fetchMunicipioData } from '@/lib/services/brasilapi.services';

// Mapeamento dos meios de pagamento para Focus NFe
const MAPA_PAGAMENTO: { [key: string]: string } = {
  'Dinheiro': '01',
  'Cheque': '02',
  'Cartão de Crédito': '03',
  'Cartão de Débito': '04',
  'Boleto/Prazo': '15',
  'PIX': '17',
};

// Monta array de pagamentos para o Focus NFe
function getPagamentos(venda: Venda) {
  return [
    {
      forma_pagamento: MAPA_PAGAMENTO[venda.metodoPagamento] || '99',
      valor_pagamento: parseFloat((venda.valorFinal ?? venda.valorTotal).toFixed(2))
    }
  ];
}

// Monta os itens/produtos para o Focus NFe
function getItensNFe(
  venda: Venda,
  todosProdutos: Produto[],
  todasUnidades: Unidade[],
  empresa: CompanyInfo
) {
  return venda.produtos.map((item: ItemVendido, index: number) => {
    const produtoCompleto = todosProdutos.find(p => p.id === item.produtoId);
    if (!produtoCompleto || produtoCompleto.tipoProduto !== 'VENDA') {
      throw new Error(`Produto inválido ou não marcado para venda: "${item.produtoNome}".`);
    }
    if (!produtoCompleto.ncm || produtoCompleto.ncm.length !== 8) {
      throw new Error(`Produto "${item.produtoNome}" com NCM inválido (deve ter 8 dígitos).`);
    }

    const unidadeInfo = todasUnidades.find(u => u.id === produtoCompleto.unidadeId);
    const unidadeComercial = unidadeInfo ? unidadeInfo.sigla.toUpperCase() : "UN";

    const cfop = produtoCompleto.cfop || empresa.configuracaoFiscal.cfop_padrao;
    if (!cfop) {
      throw new Error(`Produto "${item.produtoNome}" sem CFOP configurado.`);
    }

    const cst = produtoCompleto.cest || empresa.configuracaoFiscal.cst_padrao;
    const valorBruto = item.quantidade * item.precoUnitario;
    const aliquotaIcms = empresa.configuracaoFiscal.aliquota_icms_padrao || 0;
    const valorIcms = (valorBruto * aliquotaIcms) / 100;

    return {
      numero_item: index + 1,
      codigo_produto: produtoCompleto.codigo || item.produtoId,
      descricao: item.produtoNome,
      codigo_ncm: produtoCompleto.ncm,
      cfop: cfop,
      unidade_comercial: unidadeComercial,
      unidade_tributavel: unidadeComercial,
      quantidade_comercial: parseFloat(item.quantidade.toFixed(4)),
      valor_unitario_comercial: parseFloat(item.precoUnitario.toFixed(10)),
      quantidade_tributavel: parseFloat(item.quantidade.toFixed(4)),
      valor_unitario_tributavel: parseFloat(item.precoUnitario.toFixed(10)),
      valor_bruto: parseFloat(valorBruto.toFixed(2)),
      icms_origem: "0",
      icms_situacao_tributaria: cst,
      icms_modalidade_base_calculo: "3",
      icms_base_calculo: parseFloat(valorBruto.toFixed(2)),
      icms_aliquota: aliquotaIcms,
      icms_valor: parseFloat(valorIcms.toFixed(2)),
      pis_situacao_tributaria: "07",
      pis_valor: 0.00,
      cofins_situacao_tributaria: "07",
      cofins_valor: 0.00
    };
  });
}

// Função para checar se destinatário é contribuinte
function isDestinatarioContribuinte(cliente: Cliente): boolean {
  return Boolean(cliente.inscricaoEstadual && cliente.inscricaoEstadual !== "ISENTO");
}

export async function buildNfePayload({
  venda,
  empresa,
  cliente,
  todosProdutos,
  todasUnidades,
  ambiente
}: {
  venda: Venda;
  empresa: CompanyInfo;
  cliente: Cliente;
  todosProdutos: Produto[];
  todasUnidades: Unidade[];
  ambiente: number; // 1=produção, 2=homologação
}) {
  if (!cliente.endereco) {
    throw new Error("Endereço do cliente é obrigatório para emissão da NF-e.");
  }

  const { uf, cidade, logradouro, numero, bairro, cep } = cliente.endereco;
  if (!uf || !cidade) {
    throw new Error("UF e Cidade do endereço do cliente são obrigatórios.");
  }

  const municipioDestinatario = await fetchMunicipioData(uf, cidade);
  if (!municipioDestinatario) {
    throw new Error(`Município do destinatário é inválido: "${cidade} - ${uf}"`);
  }

  const isJuridica = cliente.tipoPessoa === 'juridica';
  const destinatarioContribuinte = isDestinatarioContribuinte(cliente);

  // Consumidor final e destino da operação
  const consumidorFinal = !destinatarioContribuinte ? 1 : 0;
  const idDest = empresa.endereco.uf === uf ? 1 : 2; // 1=Interna, 2=Interestadual

  // Indicador de IE (Tabela 17 SEFAZ)
  let indicadorIE: "1" | "2" | "9" = "9";
  if (isJuridica) {
    if (cliente.inscricaoEstadual && cliente.inscricaoEstadual !== "ISENTO") indicadorIE = "1";
    else if (cliente.inscricaoEstadual === "ISENTO") indicadorIE = "2";
  }

  const nomeDestinatario =
    ambiente === 2
      ? "NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL"
      : cliente.nomeRazaoSocial;

  const payload = {
    natureza_operacao: "Venda de mercadoria",
    ambiente,
    data_emissao: new Date().toISOString(),
    tipo_documento: 1,
    finalidade_emissao: 1,
    consumidor_final: consumidorFinal,
    presenca_comprador: 1,
    id_destino: idDest,
    cnpj_emitente: empresa.cnpj.replace(/\D/g, ''),
    nome_emitente: empresa.razaoSocial,
    rua_emitente: empresa.endereco.logradouro,
    numero_emitente: empresa.endereco.numero,
    bairro_emitente: empresa.endereco.bairro,
    municipio_emitente: empresa.endereco.cidade,
    uf_emitente: empresa.endereco.uf,
    cep_emitente: empresa.endereco.cep.replace(/\D/g, ''),
    inscricao_estadual_emitente: empresa.inscricaoEstadual,
    regime_tributario_emitente: Number(empresa.regimeTributario),
    nome_destinatario: nomeDestinatario,
    cpf_destinatario: cliente.tipoPessoa === 'fisica' ? cliente.cpfCnpj.replace(/\D/g, '') : undefined,
    cnpj_destinatario: cliente.tipoPessoa === 'juridica' ? cliente.cpfCnpj.replace(/\D/g, '') : undefined,
    logradouro_destinatario: logradouro,
    numero_destinatario: numero,
    bairro_destinatario: bairro,
    municipio_destinatario: cidade,
    uf_destinatario: uf,
    cep_destinatario: cep?.replace(/\D/g, ''),
    codigo_municipio_destinatario: municipioDestinatario.codigo_ibge,
    indicador_inscricao_estadual: indicadorIE,
    inscricao_estadual_destinatario: isJuridica ? cliente.inscricaoEstadual : undefined,
    modalidade_frete: 9,
    items: getItensNFe(venda, todosProdutos, todasUnidades, empresa),
    informacoes_adicionais_contribuinte: empresa.configuracaoFiscal.informacoes_complementares,
    formas_pagamento: getPagamentos(venda)
  };

  if (ambiente === 2) {
    console.warn("[HOMOLOGAÇÃO] Payload NF-e:", JSON.stringify(payload, null, 2));
  }

  return payload;
}
