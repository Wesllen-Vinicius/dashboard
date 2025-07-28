import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const ambiente = process.env.NFE_AMBIENTE === "PRODUCAO" ? "PRODUCAO" : "HOMOLOGACAO";

const FOCUS_NFE_URL =
  ambiente === "PRODUCAO"
    ? process.env.FOCUS_NFE_URL_PRODUCAO
    : process.env.FOCUS_NFE_URL_HOMOLOGACAO;

const FOCUS_NFE_TOKEN =
  ambiente === "PRODUCAO"
    ? process.env.FOCUS_NFE_TOKEN_PRODUCAO
    : process.env.FOCUS_NFE_TOKEN_HOMOLOGACAO;

export async function GET(req: NextRequest) {
  if (!FOCUS_NFE_TOKEN || !FOCUS_NFE_URL) {
    return NextResponse.json(
      { message: "Erro de configuração do servidor." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const ref = searchParams.get("ref");

  if (!ref) {
    return NextResponse.json(
      { message: "Referência obrigatória na query (?ref=...)" },
      { status: 400 }
    );
  }

  try {
    const response = await axios.get(`${FOCUS_NFE_URL}/v2/nfe/${ref}`, {
      params: { token: FOCUS_NFE_TOKEN },
    });

    const data = response.data;

    // 🔹 Padroniza os campos importantes que o front espera
    const resultadoPadronizado = {
      ref: data.referencia || ref,
      status: data.status,
      url_danfe: data.caminho_danfe || null,
      url_xml: data.caminho_xml_nota_fiscal || null,
      chave: data.chave_nfe || null,
      protocolo: data.protocolo_autorizacao || null,
      mensagem_sefaz: data.mensagem_sefaz || null,
      erros: data.erros || [],
    };

    return NextResponse.json(resultadoPadronizado, { status: response.status });
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          message: error.response?.data?.mensagem || error.message,
          detalhes: error.response?.data,
        },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json(
      { message: error.message || "Erro ao consultar a NF-e." },
      { status: 500 }
    );
  }
}
