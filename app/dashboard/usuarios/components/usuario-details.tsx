"use client";

import { SystemUser } from "@/lib/schemas";
import { formatDate } from "@/lib/utils/formatters";

interface UsuarioDetailsProps {
  user: SystemUser;
}

const DetailItem = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium">{value || "---"}</p>
  </div>
);

export function UsuarioDetails({ user }: UsuarioDetailsProps) {
  return (
    <div className="p-4 bg-muted/50 grid grid-cols-2 md:grid-cols-4 gap-4">
      <DetailItem label="Nome de Exibição" value={user.displayName} />
      <DetailItem label="Email" value={user.email} />
      <DetailItem label="Função (Role)" value={user.role} />
      {/* Supondo que você tenha um campo createdAt no seu schema de usuário */}
      {/* <DetailItem label="Data de Criação" value={formatDate(user.createdAt)} /> */}
    </div>
  );
}
