import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const ambiente = process.env.NFE_AMBIENTE === "PRODUCAO" ? 1 : 2;
const FOCUS_NFE_URL =
  ambiente === 1
    ? process.env.FOCUS_NFE_URL_PRODUCAO
    : process.env.FOCUS_NFE_URL_HOMOLOGACAO;
const FOCUS_NFE_TOKEN =
  ambiente === 1
    ? process.env.FOCUS_NFE_TOKEN_PRODUCAO
    : process.env.FOCUS_NFE_TOKEN_HOMOLOGACAO;

export async function DELETE(req: NextRequest) {
  if (!FOCUS_NFE_TOKEN || !FOCUS_NFE_URL) {
    return NextResponse.json(
      { message: "Erro de configuração do servidor (token ou URL inválidos)." },
      { status: 500 }
    );
  }

  const { ref, justificativa } = await req.json();

  if (!ref || !justificativa || justificativa.length < 15) {
    return NextResponse.json(
      { message: "Referência e justificativa (mín. 15 caracteres) são obrigatórias." },
      { status: 400 }
    );
  }

  try {
    const response = await axios.delete(`${FOCUS_NFE_URL}/v2/nfe/${ref}`, {
      auth: { username: FOCUS_NFE_TOKEN, password: "" },
      data: { justificativa },
      validateStatus: () => true
    });

    if (response.status >= 400 || response.data?.status === "erro_cancelamento") {
      return NextResponse.json(
        {
          message: response.data?.mensagem || "Erro ao cancelar NF-e.",
          detalhes: response.data
        },
        { status: response.status || 400 }
      );
    }

    return NextResponse.json(
      {
        ref: ref,
        status: response.data.status || "cancelado",
        mensagem_sefaz: response.data.mensagem_sefaz || "",
        erros: response.data.erros || [],
      },
      { status: 200 }
    );
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
      { message: error.message || "Erro inesperado ao cancelar NF-e." },
      { status: 500 }
    );
  }
}
