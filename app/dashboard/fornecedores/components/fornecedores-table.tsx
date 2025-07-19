"use client";

import { useMemo, useCallback } from "react";
import {
  ColumnDef,
  Row,
  ExpandedState,
  OnChangeFn,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { motion } from "framer-motion";
import {
  IconPencil,
  IconTrash,
  IconRotateClockwise,
  IconChevronDown,
} from "@tabler/icons-react";
import { Fornecedor } from "@/lib/schemas";
import { useAuthStore } from "@/store/auth.store";
import { useDataStore } from "@/store/data.store";
import { GenericTable } from "@/components/generic-table";
import { DetailsSubRow } from "@/components/details-sub-row";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCpfCnpj, formatPhone } from "@/lib/utils/formatters";
import { TruncatedCell } from "@/components/ui/truncated-cell";

interface FornecedoresTableProps {
  fornecedores: Fornecedor[];
  isLoading: boolean;
  onEdit: (fornecedor: Fornecedor) => void;
  onDelete: (id: string) => void;
  onReactivate: (id: string) => void;
  expanded: ExpandedState;
  onExpandedChange: OnChangeFn<ExpandedState>;
}

export function FornecedoresTable({
  fornecedores,
  isLoading,
  onEdit,
  onDelete,
  onReactivate,
  expanded,
  onExpandedChange,
}: FornecedoresTableProps) {
  const { user } = useAuthStore();
  const { users } = useDataStore();
  const currentUserProfile = useMemo(
    () => users.find((u) => u.uid === user?.uid),
    [users, user]
  );
  const role = currentUserProfile?.role;

  const renderSubComponent = useCallback(
    ({ row }: { row: Row<Fornecedor> }) => {
      const fornecedor = row.original;
      const enderecoCompleto = `${fornecedor.endereco?.logradouro || "N/A"}, ${
        fornecedor.endereco?.numero || "S/N"
      } - ${fornecedor.endereco?.bairro || "N/A"}, ${
        fornecedor.endereco?.cidade || ""
      } - ${fornecedor.endereco?.uf || ""}`;

      const details = [
        { label: "ID do Registro", value: fornecedor.id },
        {
          label: "Data/Hora de Criação",
          value:
            fornecedor.createdAt && fornecedor.createdAt instanceof Timestamp
              ? format(fornecedor.createdAt.toDate(), "dd/MM/yyyy 'às' HH:mm:ss")
              : "N/A",
        },
        { label: "Inscrição Estadual", value: fornecedor.inscricaoEstadual || "N/A" },
        {
          label: "Endereço",
          value: enderecoCompleto,
          className: "col-span-1 sm:col-span-2 whitespace-normal break-words",
        },
        { label: "Banco", value: fornecedor.banco?.nome || "N/A" },
        { label: "Agência", value: fornecedor.banco?.agencia || "N/A" },
        { label: "Conta", value: fornecedor.banco?.conta || "N/A" },
        { label: "Chave PIX", value: fornecedor.banco?.pix || "N/A" },
      ];
      return <DetailsSubRow details={details} />;
    },
    []
  );

  const columns: ColumnDef<Fornecedor>[] = useMemo(
    () => [
      {
        id: "expander",
        header: () => null,
        cell: ({ row }) => {
          const isExpanded = row.getIsExpanded();
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={row.getToggleExpandedHandler()}
                  >
                    <IconChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" align="center">
                  <p>{isExpanded ? "Ocultar Detalhes" : "Ver Detalhes"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        },
      },
      {
        accessorKey: "nomeRazaoSocial",
        header: "Nome / Razão Social",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <TruncatedCell>
              <span
                className={cn(
                  "font-medium",
                  row.original.status === "inativo" && "text-muted-foreground"
                )}
              >
                {row.getValue("nomeRazaoSocial")}
              </span>
            </TruncatedCell>
            {row.original.nomeFantasia && (
              <span className="text-xs text-muted-foreground truncate">
                {row.original.nomeFantasia}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "cpfCnpj",
        header: "CPF/CNPJ",
        cell: ({ row }) => formatCpfCnpj(row.getValue("cpfCnpj")),
      },
      {
        accessorKey: "telefone",
        header: "Telefone",
        cell: ({ row }) => formatPhone(row.getValue("telefone")),
      },
      {
        accessorKey: "email",
        header: "E-mail",
        cell: ({ row }) => <TruncatedCell>{row.getValue("email") || "N/A"}</TruncatedCell>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.status === "ativo" ? "success" : "destructive"
            }
          >
            {row.original.status === "ativo" ? "Ativo" : "Inativo"}
          </Badge>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const item = row.original;
          const podeEditar = role === "ADMINISTRADOR";
          return (
            <div className="flex justify-end gap-2">
              <TooltipProvider>
                {item.status === "ativo" ? (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(item)}
                          disabled={!podeEditar}
                        >
                          <IconPencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Editar</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => onDelete(item.id!)}
                          disabled={!podeEditar}
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Inativar</p>
                      </TooltipContent>
                    </Tooltip>
                  </>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onReactivate(item.id!)}
                        disabled={!podeEditar}
                      >
                        <IconRotateClockwise className="h-4 w-4 text-green-500" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reativar</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
          );
        },
      },
    ],
    [role, onEdit, onDelete, onReactivate]
  );

  if (isLoading) {
    return (
      <div className="space-y-2 mt-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <GenericTable
        columns={columns}
        data={fornecedores}
        filterPlaceholder="Pesquisar por nome ou CNPJ..."
        filterColumnId="nomeRazaoSocial"
        renderSubComponent={renderSubComponent}
        expanded={expanded}
        onExpandedChange={onExpandedChange}
      />
    </motion.div>
  );
}
