// app/api/nfe/emitir/route.ts

import { NextRequest, NextResponse } from "next/server";
import { buildNfePayload } from "@/lib/nfe/buildNfePayload";
import axios from "axios";

// Detecta ambiente via variáveis .env
const ambiente = process.env.NFE_AMBIENTE === "PRODUCAO" ? 1 : 2; // 1=produção, 2=homologação
const FOCUS_NFE_URL =
  ambiente === 1
    ? process.env.FOCUS_NFE_URL_PRODUCAO
    : process.env.FOCUS_NFE_URL_HOMOLOGACAO;
const FOCUS_NFE_TOKEN =
  ambiente === 1
    ? process.env.FOCUS_NFE_TOKEN_PRODUCAO
    : process.env.FOCUS_NFE_TOKEN_HOMOLOGACAO;

// 🔹 Função para extrair mensagens de erro de forma mais legível
function extractErrorMessage(data: any): string {
  if (!data) return "Erro desconhecido ao comunicar com o servidor de NF-e.";
  if (typeof data === "string") return data;
  if (typeof data === "object") {
    if (data.mensagem) return String(data.mensagem);
    if (data.message) return String(data.message);
    if (Array.isArray(data.erros) && data.erros.length > 0) {
      return data.erros.map((e: any) => e.mensagem || JSON.stringify(e)).join(" | ");
    }
  }
  return "Erro desconhecido ao processar a emissão da NF-e.";
}

export async function POST(req: NextRequest) {
  if (!FOCUS_NFE_TOKEN || !FOCUS_NFE_URL) {
    return NextResponse.json(
      { message: "Erro de configuração do servidor (token ou URL inválidos)." },
      { status: 500 }
    );
  }

  try {
    const { venda, empresa, cliente, todosProdutos, todasUnidades } =
      await req.json();

    if (!venda || !empresa || !cliente || !todosProdutos || !todasUnidades) {
      return NextResponse.json(
        { message: "Dados insuficientes para emitir a nota." },
        { status: 400 }
      );
    }

    const ref = venda.id;

    // 🔹 Verifica se já existe NF-e emitida com essa referência (evita rejeição duplicada)
    try {
      const check = await axios.get(`${FOCUS_NFE_URL}/v2/nfe/${ref}`, {
        params: { token: FOCUS_NFE_TOKEN },
        validateStatus: () => true,
      });

      if (check.status === 200 && check.data.status) {
        return NextResponse.json(
          {
            message: "NF-e já existe para essa venda.",
            ...check.data,
          },
          { status: 200 }
        );
      }
    } catch {
      // Se não encontrar, segue emissão normalmente
    }

    // 🔹 Monta o payload da NFe com ambiente explícito
    const nfeData = await buildNfePayload({
      venda,
      empresa,
      cliente,
      todosProdutos,
      todasUnidades,
      ambiente, // 1 ou 2
    });

    // 🔹 Chama a API Focus NFe para emissão
    const response = await axios.post(
      `${FOCUS_NFE_URL}/v2/nfe?ref=${ref}`,
      nfeData,
      {
        auth: {
          username: FOCUS_NFE_TOKEN,
          password: "",
        },
        validateStatus: () => true, // Permite tratar manualmente erros
      }
    );

    if (response.status >= 400 || response.data?.status === "erro") {
      return NextResponse.json(
        {
          message: extractErrorMessage(response.data),
          detalhes: response.data,
        },
        { status: response.status || 400 }
      );
    }

    // 🔹 Resposta com dados importantes já prontos para o frontend
    return NextResponse.json(
      {
        message: "NF-e enviada para processamento com sucesso.",
        ref: response.data.referencia || ref,
        status: response.data.status,
        caminho_danfe: response.data.caminho_danfe || null,
        caminho_xml_nota_fiscal: response.data.caminho_xml_nota_fiscal || null,
        autorizacao: response.data.mensagem_sefaz || null,
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          message: extractErrorMessage(error.response?.data) || error.message,
          detalhes: error.response?.data,
        },
        { status: error.response?.status || 500 }
      );
    }

    return NextResponse.json(
      {
        message: error.message || "Falha ao processar a requisição de NF-e.",
      },
      { status: 500 }
    );
  }
}
