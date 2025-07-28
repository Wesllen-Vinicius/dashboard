// app/api/nfe/preview/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { buildNfePayload } from '@/lib/nfe/buildNfePayload';
import axios from 'axios';

// Sempre ambiente de homologação para preview!
const FOCUS_NFE_URL = process.env.FOCUS_NFE_URL_HOMOLOGACAO;
const FOCUS_NFE_TOKEN = process.env.FOCUS_NFE_TOKEN_HOMOLOGACAO;

export async function POST(req: NextRequest) {
  if (!FOCUS_NFE_TOKEN || !FOCUS_NFE_URL) {
    return NextResponse.json({ message: "Erro de configuração do servidor." }, { status: 500 });
  }

  try {
    const { venda, empresa, cliente, todosProdutos, todasUnidades } = await req.json();
    if (!venda || !empresa || !cliente || !todosProdutos || !todasUnidades) {
      return NextResponse.json({ message: 'Dados insuficientes para gerar o preview.' }, { status: 400 });
    }

    // Monta o payload (sempre ambiente de homologação)
    const nfeData = await buildNfePayload({
      venda,
      empresa,
      cliente,
      todosProdutos,
      todasUnidades,
      ambiente: 2,
    });

    // Usar um ref temporário
    const ref = `preview_${venda.id || Date.now()}`;

    // 1. Cria a nota em homologação (NUNCA salva no banco)
    const respEmitir = await axios.post(
      `${FOCUS_NFE_URL}/v2/nfe?ref=${ref}`,
      nfeData,
      {
        auth: {
          username: FOCUS_NFE_TOKEN,
          password: ''
        }
      }
    );

    // Pega referência gerada
    const notaRef = respEmitir.data.referencia || respEmitir.data.ref || ref;

    // 2. Busca o PDF DANFE
    const respPdf = await axios.get(
      `${FOCUS_NFE_URL}/v2/nfe/${notaRef}/pdf`,
      {
        params: { token: FOCUS_NFE_TOKEN },
        responseType: "arraybuffer"
      }
    );

    // 3. (Opcional) Deleta a nota logo após preview
    await axios.delete(
      `${FOCUS_NFE_URL}/v2/nfe/${notaRef}`,
      { params: { token: FOCUS_NFE_TOKEN } }
    );

    return new NextResponse(respPdf.data, {
      status: 200,
      headers: { "Content-Type": "application/pdf" }
    });

  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json({
        message: error.response?.data?.mensagem || error.message,
        detalhes: error.response?.data
      }, { status: error.response?.status || 500 });
    }

    return NextResponse.json({ message: error.message || "Falha ao processar o preview de NF-e." }, { status: 500 });
  }
}
