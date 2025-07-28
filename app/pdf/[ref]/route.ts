import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// Tipo correto do segundo parâmetro em rotas dinâmicas
type ParamsContext = {
  params: { ref: string };
};

export async function GET(req: NextRequest, context: ParamsContext) {
  const ref = context.params.ref;

  const ambiente = process.env.NFE_AMBIENTE || "HOMOLOGACAO";
  const FOCUS_NFE_URL =
    ambiente === "PRODUCAO"
      ? process.env.FOCUS_NFE_URL_PRODUCAO
      : process.env.FOCUS_NFE_URL_HOMOLOGACAO;
  const FOCUS_NFE_TOKEN =
    ambiente === "PRODUCAO"
      ? process.env.FOCUS_NFE_TOKEN_PRODUCAO
      : process.env.FOCUS_NFE_TOKEN_HOMOLOGACAO;

  if (!FOCUS_NFE_TOKEN || !FOCUS_NFE_URL) {
    return NextResponse.json(
      { message: "Erro de configuração do servidor." },
      { status: 500 }
    );
  }

  try {
    const response = await axios.get(`${FOCUS_NFE_URL}/v2/nfe/${ref}/pdf`, {
      params: { token: FOCUS_NFE_TOKEN },
      responseType: "arraybuffer",
    });

    return new NextResponse(response.data, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="danfe-${ref}.pdf"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: error.response?.data?.mensagem || error.message,
        detalhes: error.response?.data,
      },
      { status: error.response?.status || 500 }
    );
  }
}
