"use client";

import { Funcionario } from "@/lib/schemas";
import { formatCpfCnpj, formatCep, formatPhone } from "@/lib/utils/formatters";

interface FuncionarioDetailsProps {
  funcionario: Funcionario;
}

const DetailItem = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium">{value || "---"}</p>
  </div>
);

export function FuncionarioDetails({ funcionario }: FuncionarioDetailsProps) {
  return (
    <div className="p-4 bg-muted/50 grid grid-cols-2 md:grid-cols-4 gap-4">
      <DetailItem label="CPF" value={formatCpfCnpj(funcionario.cpf)} />
      <DetailItem label="CNPJ (MEI)" value={formatCpfCnpj(funcionario.cnpj)} />
      <div className="col-span-2 md:col-span-1">
         <DetailItem label="Razão Social" value={funcionario.razaoSocial} />
      </div>
      <div className="col-span-2 md:col-span-4 border-t my-2"></div>
      <div className="col-span-2 md:col-span-4">
        <h4 className="text-sm font-semibold mb-2">Endereço</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DetailItem label="Logradouro" value={`${funcionario.endereco?.logradouro}, ${funcionario.endereco?.numero}`} />
          <DetailItem label="Bairro" value={funcionario.endereco?.bairro} />
          <DetailItem label="Cidade/UF" value={`${funcionario.endereco?.cidade} / ${funcionario.endereco?.uf}`} />
          <DetailItem label="CEP" value={formatCep(funcionario.endereco?.cep)} />
        </div>
      </div>
      <div className="col-span-2 md:col-span-4 border-t my-2"></div>
      <div className="col-span-2 md:col-span-4">
        <h4 className="text-sm font-semibold mb-2">Dados Bancários</h4>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DetailItem label="Banco" value={funcionario.banco} />
            <DetailItem label="Agência" value={funcionario.agencia} />
            <DetailItem label="Conta" value={funcionario.conta} />
         </div>
      </div>
    </div>
  );
}
