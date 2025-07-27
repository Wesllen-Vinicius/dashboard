// estoque/components/estoque-table.tsx
'use client';

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useDataStore } from "@/store/data.store";
import { GenericTable } from "@/components/generic-table";
import type { Movimentacao } from "@/lib/schemas";

type MovimentacaoEnriquecida = Movimentacao & {
  produtoNome: string;
  dataFormatada: string;
  registradoPorNome: string | null;
};

export function EstoqueTable() {
  const { produtos, movimentacoes } = useDataStore();
  const [searchTerm, setSearchTerm] = useState("");

  const movimentacoesEnriquecidas = useMemo<MovimentacaoEnriquecida[]>(() => {
    const lowerFilter = searchTerm.toLowerCase();
    return movimentacoes
      .map((mov) => {
        const prod = produtos.find((p) => p.id === mov.produtoId);
        let dateStr = "–";
        if (mov.data) {
          if (mov.data instanceof Timestamp) {
            dateStr = format(mov.data.toDate(), "dd/MM/yyyy HH:mm");
          } else if (mov.data instanceof Date) {
            dateStr = format(mov.data, "dd/MM/yyyy HH:mm");
          }
        }
        return {
          ...mov,
          produtoNome: prod?.nome || "–",
          dataFormatada: dateStr,
          registradoPorNome: mov.registradoPor?.nome || "Sistema",
        };
      })
      .filter((m) => m.produtoNome.toLowerCase().includes(lowerFilter));
  }, [movimentacoes, produtos, searchTerm]);

  const columns: ColumnDef<MovimentacaoEnriquecida>[] = [
    { accessorKey: "dataFormatada", header: "Data" },
    { accessorKey: "produtoNome", header: "Produto" },
    {
      accessorKey: "quantidade",
      header: "Qtd",
      cell: ({ row }) => <div className="text-center">{row.original.quantidade}</div>,
    },
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => {
        const isEntrada = row.original.tipo === "entrada";
        return (
          <Badge variant={isEntrada ? "success" : "destructive"}>
            {isEntrada ? "Entrada" : "Saída"}
          </Badge>
        );
      },
    },
    { accessorKey: "motivo", header: "Motivo" },
    { accessorKey: "registradoPorNome", header: "Quem" },
  ];

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Histórico de Movimentações</CardTitle>
        <Input
          placeholder="Filtrar por produto…"
          className="max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </CardHeader>
      <CardContent>
        <GenericTable columns={columns} data={movimentacoesEnriquecidas} />
      </CardContent>
    </Card>
  );
}
